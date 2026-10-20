import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const grup_id = searchParams.get("grup_id");
  const kelas_id = searchParams.get("kelas_id");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let query = `
    SELECT t.*, u.nim, u.nama as nama_mahasiswa, g.nama as nama_grup, k.nama as nama_kelas
    FROM transaksi t
    JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    JOIN users u ON kg.user_id = u.id
    JOIN grup_tabungan g ON kg.grup_id = g.id
    JOIN kelas k ON g.kelas_id = k.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status) {
    query += " AND t.status = ?";
    params.push(status);
  }
  if (grup_id) {
    query += " AND g.id = ?";
    params.push(grup_id);
  }
  if (kelas_id) {
    query += " AND k.id = ?";
    params.push(kelas_id);
  }

  query += " ORDER BY t.created_at DESC LIMIT ?";
  params.push(limit);

  const data = db.prepare(query).all(...params);

  return NextResponse.json({ data });
}
