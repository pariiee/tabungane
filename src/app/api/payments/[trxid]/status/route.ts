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
      `SELECT t.*, k.user_id, k.grup_id 
       FROM transaksi t 
       JOIN keanggotaan k ON t.keanggotaan_id = k.id 
       WHERE t.qris_trx_id = ?`
    )
    .get(trxid) as any;

  if (!trx) {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
  }

  // Check if expired
  if (trx.status === "pending" && trx.expired_at && new Date(trx.expired_at) < new Date()) {
    db.prepare("UPDATE transaksi SET status = 'expired' WHERE id = ?").run(trx.id);
    trx.status = "expired";
  }

  // Developer simulation helper for testing without live merchant account
  if (simulatePay && trx.status === "pending") {
    db.prepare("UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?").run(trx.id);
    trx.status = "berhasil";
    trx.paid_at = new Date().toISOString();
  }

  // Calculate current user balance in this group
  const balanceRow = db
    .prepare(
      `SELECT COALESCE(SUM(jumlah), 0) as total 
       FROM transaksi 
       WHERE keanggotaan_id = ? AND status = 'berhasil'`
    )
    .get(trx.keanggotaan_id) as any;

  return NextResponse.json({
    status: trx.status,
    amount: trx.jumlah,
    paid_at: trx.paid_at,
    current_balance: balanceRow?.total || 0,
  });
}
