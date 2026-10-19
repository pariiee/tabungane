import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transactions = db.prepare(`
    SELECT t.*, g.nama as nama_grup
    FROM transaksi t
    JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    JOIN grup_tabungan g ON kg.grup_id = g.id
    WHERE kg.user_id = ?
    ORDER BY t.created_at DESC
  `).all(user.id);

  return NextResponse.json({ data: transactions });
}
