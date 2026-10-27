import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trxid: string }> }
) {
  const { trxid } = await params;
  const url = new URL(req.url);
  const simulatePay = url.searchParams.get("simulate_pay") === "1";

  const trx = db
    .prepare(
      `SELECT t.*, k.user_id as member_user_id, k.grup_id, u.nama as user_nama, u.nim as user_nim
       FROM transaksi t 
       LEFT JOIN keanggotaan k ON t.keanggotaan_id = k.id 
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.qris_trx_id = ? OR t.id = ?`
    )
    .get(trxid, trxid) as any;

  if (!trx) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  // First: Fallback sync with gateway if pending or expired
  if ((trx.status === "pending" || trx.status === "expired") && trx.qris_trx_id && !trx.qris_trx_id.startsWith("qsim")) {
    try {
      const { getAlpayStatus } = require("@/lib/alpay");
      const qJson = await getAlpayStatus(trx.qris_trx_id);
      const qItem = qJson.data || qJson;
      const remoteStatus = String(qJson.status || qItem.status || "").toLowerCase();
      const isPaid = qJson.paid === true || remoteStatus === "paid" || remoteStatus === "berhasil";

      if (isPaid) {
        const { creditPayment } = require("@/lib/ledger");
        creditPayment(
          trx.qris_trx_id,
          `sync-${trx.qris_trx_id}-${Date.now()}`,
          JSON.stringify(qJson),
          qItem.amount ? Number(qItem.amount) : trx.jumlah
        );
        trx.status = "berhasil";
        trx.paid_at = qItem.paid_at ? (typeof qItem.paid_at === "number" ? new Date(qItem.paid_at * 1000).toISOString() : qItem.paid_at) : new Date().toISOString();
        if (qItem.issuer) {
          trx.channel = qItem.issuer;
        }
      } else if (remoteStatus === "expired" || remoteStatus === "canceled" || remoteStatus === "cancelled") {
        const normalized = remoteStatus === "cancelled" ? "canceled" : remoteStatus;
        db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(normalized, trx.id);
        trx.status = normalized;
      }
    } catch {}
  }

  // Check if locally expired (only if gateway did not mark it paid)
  if (trx.status === "pending" && trx.expired_at && new Date(trx.expired_at) < new Date()) {
    db.prepare("UPDATE transaksi SET status = 'expired' WHERE id = ?").run(trx.id);
    trx.status = "expired";
  }

  // Developer simulation helper: strictly restrict to authenticated Super Admin or local dev
  if (simulatePay && trx.status === "pending") {
    const { getCurrentUser } = require("@/lib/auth");
    const user = await getCurrentUser();
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Simulasi pembayaran hanya diizinkan untuk Tim Developer" }, { status: 403 });
    }
    db.prepare("UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(trx.id);
    trx.status = "berhasil";
    trx.paid_at = new Date().toISOString();
  }

  // Calculate current user balance in this group or wallet
  let currentBalance = 0;
  if (trx.keanggotaan_id) {
    const balanceRow = db
      .prepare(
        `SELECT COALESCE(SUM(jumlah), 0) as total 
         FROM transaksi 
         WHERE keanggotaan_id = ? AND status = 'berhasil'`
      )
      .get(trx.keanggotaan_id) as any;
    currentBalance = balanceRow?.total || 0;
  } else {
    const balanceRow = db
      .prepare(
        `SELECT COALESCE(SUM(jumlah), 0) as total 
         FROM transaksi 
         WHERE user_id = ? AND status = 'berhasil'`
      )
      .get(trx.user_id) as any;
    currentBalance = balanceRow?.total || 0;
  }

  let qrUrl = trx.qr_url;
  if (!qrUrl && trx.qris_trx_id && !trx.qris_trx_id.startsWith("qsim")) {
    qrUrl = `https://pay.ghifari.biz.id/img/qr-${trx.qris_trx_id}.png`;
  }

  if (!qrUrl) {
    qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226${trx.qris_trx_id || "sim"}520458125303360540${trx.jumlah}5802ID5916TABUNGANE-SISFOR`;
  }

  return NextResponse.json({
    id: trx.id,
    qris_trx_id: trx.qris_trx_id,
    status: trx.status,
    amount: trx.jumlah,
    paid_at: trx.paid_at,
    created_at: trx.created_at,
    expired_at: trx.expired_at,
    channel: trx.channel || "QRIS",
    catatan: trx.catatan,
    ref_transaksi_id: trx.ref_transaksi_id,
    qr_url: qrUrl,
    current_balance: currentBalance,
  });
}
