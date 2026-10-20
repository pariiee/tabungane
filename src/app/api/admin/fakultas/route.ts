import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = db
    .prepare(
      `SELECT 
        f.id, f.nama, f.kode, f.created_at,
        (SELECT COUNT(p.id) FROM prodi p WHERE p.fakultas_id = f.id OR p.fakultas = f.nama) as total_prodi
      FROM fakultas f
      ORDER BY f.nama ASC`
    )
    .all();

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat membuat Fakultas" }, { status: 403 });
  }

  const { nama, kode } = await req.json();

  if (!nama || !kode) {
    return NextResponse.json({ error: "Nama dan Kode Fakultas wajib diisi" }, { status: 400 });
  }

  const cleanKode = kode.trim().toUpperCase();
  const existing = db.prepare("SELECT id FROM fakultas WHERE kode = ?").get(cleanKode);
  if (existing) {
    return NextResponse.json({ error: "Kode Fakultas sudah terdaftar" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  db.prepare("INSERT INTO fakultas (id, nama, kode) VALUES (?, ?, ?)").run(id, nama.trim(), cleanKode);

  logAudit(user.id, "TAMBAH_FAKULTAS", id, `Menambahkan fakultas: ${nama} (${cleanKode})`);

  return NextResponse.json({
    success: true,
    data: { id, nama: nama.trim(), kode: cleanKode },
  });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus Fakultas" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID Fakultas diperlukan" }, { status: 400 });
  }

  // Check if any prodi belongs to this faculty
  const fak = db.prepare("SELECT nama, kode FROM fakultas WHERE id = ?").get(id) as any;
  if (!fak) {
    return NextResponse.json({ error: "Fakultas tidak ditemukan" }, { status: 404 });
  }

  const hasProdi = db
    .prepare("SELECT COUNT(*) as count FROM prodi WHERE fakultas_id = ? OR fakultas = ?")
    .get(id, fak.nama) as any;

  if (hasProdi && hasProdi.count > 0) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus fakultas yang masih membawahi Program Studi. Hapus atau pindahkan prodi terlebih dahulu." },
      { status: 400 }
    );
  }

  db.prepare("DELETE FROM fakultas WHERE id = ?").run(id);
  logAudit(user.id, "HAPUS_FAKULTAS", id, `Menghapus fakultas: ${fak.nama} (${fak.kode})`);

  return NextResponse.json({ success: true });
}
