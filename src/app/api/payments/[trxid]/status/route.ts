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

  // Check if expired
  if (trx.status === "pending" && trx.expired_at && new Date(trx.expired_at) < new Date()) {
    db.prepare("UPDATE transaksi SET status = 'expired' WHERE id = ?").run(trx.id);
    trx.status = "expired";
  }

  // Fallback sync with gateway if still pending
  if (trx.status === "pending" && trx.qris_trx_id && !trx.qris_trx_id.startsWith("qsim")) {
    try {
      const apiKey = process.env.QRISKUU_API_KEY || "";
      if (apiKey) {
        const baseUrl = process.env.QRISKUU_BASE_URL || "https://qriskuu.com";
        const qRes = await fetch(`${baseUrl}/payments/${encodeURIComponent(trx.qris_trx_id)}`, {
          headers: { "X-API-Key": apiKey },
          signal: AbortSignal.timeout(3000),
        });
        if (qRes.ok) {
          const qData = await qRes.json();
          const qItem = qData.data || qData;
          if (qItem.status === "paid" || qItem.status === "berhasil") {
            db.prepare("UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(trx.id);
            trx.status = "berhasil";
            trx.paid_at = new Date().toISOString();
          } else if (qItem.status === "expired" || qItem.status === "canceled") {
            db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(qItem.status, trx.id);
            trx.status = qItem.status;
          }
        }
      }
    } catch {}
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
    try {
      const apiKey = process.env.QRISKUU_API_KEY || "";
      if (apiKey) {
        const baseUrl = process.env.QRISKUU_BASE_URL || "https://qriskuu.com";
        const listRes = await fetch(`${baseUrl}/payments?limit=50`, {
          headers: { "X-API-Key": apiKey },
          signal: AbortSignal.timeout(3000),
        });
        if (listRes.ok) {
          const listJson = await listRes.json();
          const match = (listJson.data || []).find((p: any) => p.id === trx.qris_trx_id);
          if (match?.qr_url) {
            qrUrl = match.qr_url;
            try {
              db.prepare("UPDATE transaksi SET qr_url = ? WHERE id = ?").run(match.qr_url, trx.id);
            } catch {}
          }
        }
      }
    } catch {}
  }

  if (!qrUrl) {
    if (trx.qris_trx_id && !trx.qris_trx_id.startsWith("qsim")) {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`https://qriskuu.com/pay/${trx.qris_trx_id}`)}`;
    } else {
      qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226${trx.qris_trx_id || "sim"}520458125303360540${trx.jumlah}5802ID5916TABUNGANE-SISFOR`;
    }
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
