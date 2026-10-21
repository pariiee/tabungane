import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const term = `%${q}%`;
  const students = db.prepare(`
    SELECT COALESCE(u.nomor_id, u.nim) as nomor_id, u.nama, u.username, k.nama as nama_kelas
    FROM users u
    LEFT JOIN kelas k ON u.kelas_id = k.id
    WHERE u.role IN ('mahasiswa', 'admin_kelas')
      AND u.aktif = 1
      AND u.id != ?
      AND (
        u.nomor_id LIKE ? OR u.nim LIKE ? OR (u.username IS NOT NULL AND u.username LIKE ?) OR u.nama LIKE ?
      )
    ORDER BY u.nama ASC
    LIMIT 6
  `).all(user.id, term, term, term, term);

  return NextResponse.json({ data: students });
}
