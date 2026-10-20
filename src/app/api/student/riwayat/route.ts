import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let query = `
    SELECT t.*, COALESCE(g.nama, 'Dompet Utama') as nama_grup
    FROM transaksi t
    LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    LEFT JOIN grup_tabungan g ON kg.grup_id = g.id
    WHERE (t.user_id = ? OR kg.user_id = ?)
  `;
  const params: any[] = [user.id, user.id];

  if (tipe === "topup") {
    query += " AND t.tipe = 'topup_qris'";
  }

  query += " ORDER BY t.created_at DESC LIMIT ?";
  params.push(limit);

  const transactions = db.prepare(query).all(...params);

  return NextResponse.json({ data: transactions });
}
