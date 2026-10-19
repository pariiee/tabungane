import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const kelas_id = searchParams.get("kelas_id");

  let query = `
    SELECT u.id, u.nim, u.nama, u.role, u.kelas_id, u.must_change_password, u.aktif, u.created_at,
           k.nama as nama_kelas, k.tahun_ajaran
    FROM users u
    LEFT JOIN kelas k ON u.kelas_id = k.id
    WHERE u.role = 'mahasiswa'
  `;
  const params: any[] = [];

  if (kelas_id) {
    query += " AND u.kelas_id = ?";
    params.push(kelas_id);
  }

  query += " ORDER BY u.nim ASC";

  const data = db.prepare(query).all(...params);
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { nim, nama, kelas_id } = await req.json();
  if (!nim || !nama || !kelas_id) {
    return NextResponse.json({ error: "NIM, nama, dan kelas wajib diisi" }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE nim = ?").get(nim);
  if (existing) {
    return NextResponse.json({ error: `NIM ${nim} sudah terdaftar` }, { status: 400 });
  }

  // Generate temporary password (e.g. 8 chars)
  const tempPassword = `pwd${Math.floor(100000 + Math.random() * 900000)}`;
  const passwordHash = hashPassword(tempPassword);
  const id = crypto.randomUUID();

  const { runTransaction } = require("@/lib/db");
  runTransaction(() => {
    db.prepare(`
      INSERT INTO users (id, nim, nama, role, kelas_id, password_hash, must_change_password, aktif)
      VALUES (?, ?, ?, 'mahasiswa', ?, ?, 1, 1)
    `).run(id, nim, nama, kelas_id, passwordHash);

    // Auto enroll in active groups of this class or open to all classes (idempotent)
    const groups = db.prepare("SELECT id FROM grup_tabungan WHERE (kelas_id = ? OR kelas_id IS NULL) AND status = 'aktif'").all(kelas_id) as any[];
    for (const g of groups) {
      try {
        db.prepare("INSERT OR IGNORE INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
          crypto.randomUUID(),
          g.id,
          id
        );
      } catch {}
    }
  });

  logAudit(user.id, "TAMBAH_MAHASISWA", id, `NIM: ${nim}, Nama: ${nama}`);

  return NextResponse.json({
    success: true,
    temp_password: tempPassword,
    nim,
    nama,
  });
}
