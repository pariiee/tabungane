import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProdiScope } from "@/lib/scope";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prodiScope = getProdiScope(user);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const grup_id = searchParams.get("grup_id");
  const kelas_id = searchParams.get("kelas_id");
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  let query = `
    SELECT t.*, u.nim, u.nama as nama_mahasiswa, COALESCE(g.nama, 'Dompet Utama (Saku)') as nama_grup, COALESCE(k.nama, 'Dompet Utama') as nama_kelas
    FROM transaksi t
    LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    LEFT JOIN grup_tabungan g ON kg.grup_id = g.id
    LEFT JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
    LEFT JOIN kelas k ON (g.kelas_id = k.id OR u.kelas_id = k.id)
    WHERE 1=1
  `;
  const params: any[] = [];

  if (prodiScope) {
    query += " AND (k.prodi_id = ? OR u.prodi_id = ?)";
    params.push(prodiScope, prodiScope);
  }

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
