import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Super Admin sees all prodi; Admin Prodi sees only their assigned prodi
  let list = [];
  if (user.role === "super_admin") {
    list = db
      .prepare(
        `SELECT 
          p.id, p.nama, p.kode, p.created_at,
          (SELECT COUNT(k.id) FROM kelas k WHERE k.prodi_id = p.id) as total_kelas,
          (SELECT COUNT(u.id) FROM users u JOIN kelas k2 ON u.kelas_id = k2.id WHERE k2.prodi_id = p.id AND u.role = 'mahasiswa' AND u.aktif = 1) as total_mahasiswa
        FROM prodi p
        ORDER BY p.nama ASC`
      )
      .all();
  } else {
    list = db
      .prepare(
        `SELECT 
          p.id, p.nama, p.kode, p.created_at,
          (SELECT COUNT(k.id) FROM kelas k WHERE k.prodi_id = p.id) as total_kelas,
          (SELECT COUNT(u.id) FROM users u JOIN kelas k2 ON u.kelas_id = k2.id WHERE k2.prodi_id = p.id AND u.role = 'mahasiswa' AND u.aktif = 1) as total_mahasiswa
        FROM prodi p
        WHERE p.id = ?
        ORDER BY p.nama ASC`
      )
      .all(user.prodi_id);
  }

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  // Only Super Admin can create a new Prodi
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat membuat Program Studi" }, { status: 403 });
  }

  const { nama, kode } = await req.json();

  if (!nama || !kode) {
    return NextResponse.json({ error: "Nama dan Kode Prodi wajib diisi" }, { status: 400 });
  }

  const cleanKode = kode.trim().toUpperCase();
  const existing = db.prepare("SELECT id FROM prodi WHERE kode = ?").get(cleanKode);
  if (existing) {
    return NextResponse.json({ error: "Kode Program Studi sudah terdaftar" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO prodi (id, nama, kode) VALUES (?, ?, ?)").run(id, nama.trim(), cleanKode);

  logAudit(user.id, "TAMBAH_PRODI", id, `Menambahkan prodi: ${nama} (${cleanKode})`);

  return NextResponse.json({
    success: true,
    data: { id, nama: nama.trim(), kode: cleanKode },
  });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  // Only Super Admin can delete a Prodi
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus Program Studi" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID Prodi diperlukan" }, { status: 400 });
  }

  // Check if any class is associated with this prodi
  const hasKelas = db.prepare("SELECT COUNT(*) as count FROM kelas WHERE prodi_id = ?").get(id) as any;
  if (hasKelas && hasKelas.count > 0) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus prodi yang masih memiliki data kelas. Hapus atau pindahkan kelas terlebih dahulu." },
      { status: 400 }
    );
  }

  const prodi = db.prepare("SELECT nama, kode FROM prodi WHERE id = ?").get(id) as any;
  db.prepare("DELETE FROM prodi WHERE id = ?").run(id);

  if (prodi) {
    logAudit(user.id, "HAPUS_PRODI", id, `Menghapus prodi: ${prodi.nama} (${prodi.kode})`);
  }

  return NextResponse.json({ success: true });
}
