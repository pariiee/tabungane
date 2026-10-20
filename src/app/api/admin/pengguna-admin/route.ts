import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getCurrentUser, hashPassword, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat mengakses daftar Admin" }, { status: 403 });
  }

  const list = db
    .prepare(
      `SELECT 
        u.id, u.nim, u.nama, u.role, u.prodi_id, u.fakultas, u.aktif, u.created_at,
        CASE
          WHEN u.prodi_id IS NOT NULL THEN p.nama
          WHEN u.fakultas IS NOT NULL THEN 'Dekan / Fakultas ' || u.fakultas
          ELSE 'Semua Prodi (Super)'
        END as nama_prodi,
        COALESCE(p.kode, CASE WHEN u.fakultas IS NOT NULL THEN 'FAK' ELSE 'GLOBAL' END) as kode_prodi
      FROM users u
      LEFT JOIN prodi p ON u.prodi_id = p.id
      WHERE u.role IN ('super_admin', 'admin')
      ORDER BY u.role DESC, u.nama ASC`
    )
    .all();

  return NextResponse.json({ data: list });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat membuat akun Admin" }, { status: 403 });
  }

  const { nim, nama, password, prodi_id, fakultas } = await req.json();

  if (!nim || !nama || !password) {
    return NextResponse.json({ error: "NIM/NIP, Nama, dan Password wajib diisi" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
  }

  const cleanNim = nim.trim();
  const existing = db.prepare("SELECT id FROM users WHERE nim = ?").get(cleanNim);
  if (existing) {
    return NextResponse.json({ error: "NIM / NIP / Username sudah terdaftar" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  // Role 'admin' for scoped admin prodi / fakultas, or 'super_admin' if no prodi_id and no fakultas specified
  const isScoped = Boolean(prodi_id || fakultas);
  const role = isScoped ? "admin" : "super_admin";

  db.prepare(`
    INSERT INTO users (id, nim, nama, role, prodi_id, fakultas, password_hash, must_change_password, aktif)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1)
  `).run(id, cleanNim, nama.trim(), role, prodi_id || null, fakultas || null, passwordHash);

  const prodi = prodi_id ? db.prepare("SELECT nama FROM prodi WHERE id = ?").get(prodi_id) as any : null;
  const scopeDesc = prodi ? `Prodi: ${prodi.nama}` : fakultas ? `Fakultas: ${fakultas}` : "Global";

  logAudit(
    user.id,
    "BUAT_ADMIN",
    id,
    `Membuat akun Admin: ${nama} (${cleanNim}) - Scope: ${scopeDesc}`
  );

  return NextResponse.json({
    success: true,
    data: { id, nim: cleanNim, nama: nama.trim(), role, prodi_id },
  });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Hanya Super Admin yang dapat menghapus akun Admin" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID Admin diperlukan" }, { status: 400 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
  }

  const target = db.prepare("SELECT nama, nim FROM users WHERE id = ?").get(id) as any;
  db.prepare("DELETE FROM users WHERE id = ?").run(id);

  if (target) {
    logAudit(user.id, "HAPUS_ADMIN", id, `Menghapus akun admin: ${target.nama} (${target.nim})`);
  }

  return NextResponse.json({ success: true });
}
