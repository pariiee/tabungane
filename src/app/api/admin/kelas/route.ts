import { NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = db.prepare(`
    SELECT k.*, 
      (SELECT COUNT(*) FROM users u WHERE u.kelas_id = k.id AND u.aktif = 1) as jumlah_mahasiswa
    FROM kelas k
    ORDER BY k.nama ASC
  `).all();

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nama, tahun_ajaran } = await req.json();
  if (!nama || !tahun_ajaran) {
    return NextResponse.json({ error: "Nama kelas dan tahun ajaran wajib diisi" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO kelas (id, nama, tahun_ajaran) VALUES (?, ?, ?)").run(id, nama, tahun_ajaran);

  logAudit(user.id, "TAMBAH_KELAS", id, `Kelas ${nama} (${tahun_ajaran})`);

  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID kelas diperlukan" }, { status: 400 });

  db.prepare("DELETE FROM kelas WHERE id = ?").run(id);
  logAudit(user.id, "HAPUS_KELAS", id);

  return NextResponse.json({ success: true });
}
