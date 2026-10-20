import { NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessKelas, getProdiScope } from "@/lib/scope";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prodiScope = getProdiScope(user);

  let list = [];
  if (prodiScope) {
    list = db
      .prepare(
        `SELECT k.*, p.nama as nama_prodi, p.kode as kode_prodi,
          (SELECT COUNT(*) FROM users u WHERE u.kelas_id = k.id AND u.aktif = 1) as jumlah_mahasiswa
        FROM kelas k
        LEFT JOIN prodi p ON k.prodi_id = p.id
        WHERE k.prodi_id = ?
        ORDER BY k.nama ASC`
      )
      .all(prodiScope);
  } else {
    list = db
      .prepare(
        `SELECT k.*, p.nama as nama_prodi, p.kode as kode_prodi,
          (SELECT COUNT(*) FROM users u WHERE u.kelas_id = k.id AND u.aktif = 1) as jumlah_mahasiswa
        FROM kelas k
        LEFT JOIN prodi p ON k.prodi_id = p.id
        ORDER BY p.nama ASC, k.nama ASC`
      )
      .all();
  }

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nama, tahun_ajaran, prodi_id } = await req.json();
  if (!nama || !tahun_ajaran) {
    return NextResponse.json({ error: "Nama kelas dan tahun ajaran wajib diisi" }, { status: 400 });
  }

  // Admin Prodi strictly locked to their prodi_id
  let targetProdiId = prodi_id;
  if (user.role === "admin") {
    targetProdiId = user.prodi_id;
  } else if (!targetProdiId) {
    const defaultProdi = db.prepare("SELECT id FROM prodi LIMIT 1").get() as any;
    targetProdiId = defaultProdi ? defaultProdi.id : null;
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO kelas (id, prodi_id, nama, tahun_ajaran) VALUES (?, ?, ?, ?)").run(
    id,
    targetProdiId,
    nama.trim(),
    tahun_ajaran.trim()
  );

  logAudit(user.id, "TAMBAH_KELAS", id, `Kelas ${nama} (${tahun_ajaran})`);

  return NextResponse.json({ success: true, id });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID kelas diperlukan" }, { status: 400 });

  // Authorization check
  if (!canAccessKelas(user, id)) {
    return NextResponse.json({ error: "Anda tidak berhak menghapus kelas di luar Program Studi Anda" }, { status: 403 });
  }

  db.prepare("DELETE FROM kelas WHERE id = ?").run(id);
  logAudit(user.id, "HAPUS_KELAS", id);

  return NextResponse.json({ success: true });
}
