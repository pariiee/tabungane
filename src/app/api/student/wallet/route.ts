import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = getWalletBalance(user.id);

  // Riwayat mutasi dompet utama (transaksi tanpa keanggotaan_id atau transaksi terkait dompet)
  const history = db
    .prepare(
      `SELECT id, tipe, jumlah, status, catatan, created_at, paid_at
       FROM transaksi
       WHERE user_id = ? AND keanggotaan_id IS NULL AND status = 'berhasil'
       ORDER BY created_at DESC LIMIT 20`
    )
    .all(user.id);

  return NextResponse.json({
    balance,
    history,
  });
}
