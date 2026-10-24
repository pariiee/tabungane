import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessKelas, getProdiScope } from "@/lib/scope";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prodiScope = getProdiScope(user);

  let groups = [];
  if (prodiScope) {
    groups = db.prepare(`
      SELECT g.*, COALESCE(k.nama, 'Semua Kelas') as nama_kelas, k.tahun_ajaran,
        (SELECT COUNT(*) FROM keanggotaan kg WHERE kg.grup_id = g.id) as total_anggota,
        (SELECT COALESCE(SUM(t.jumlah), 0) 
         FROM transaksi t 
         JOIN keanggotaan kg ON t.keanggotaan_id = kg.id 
         WHERE kg.grup_id = g.id AND t.status = 'berhasil') as total_terkumpul
      FROM grup_tabungan g
      JOIN kelas k ON g.kelas_id = k.id
      WHERE k.prodi_id = ?
      ORDER BY g.created_at DESC
    `).all(prodiScope);
  } else {
    groups = db.prepare(`
      SELECT g.*, COALESCE(k.nama, 'Semua Kelas') as nama_kelas, k.tahun_ajaran,
        (SELECT COUNT(*) FROM keanggotaan kg WHERE kg.grup_id = g.id) as total_anggota,
        (SELECT COALESCE(SUM(t.jumlah), 0) 
         FROM transaksi t 
         JOIN keanggotaan kg ON t.keanggotaan_id = kg.id 
         WHERE kg.grup_id = g.id AND t.status = 'berhasil') as total_terkumpul
      FROM grup_tabungan g
      LEFT JOIN kelas k ON g.kelas_id = k.id
      ORDER BY g.created_at DESC
    `).all();
  }

  return NextResponse.json({ data: groups });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { kelas_id, nama, target_per_mahasiswa, deadline } = await req.json();
  if (!nama || !target_per_mahasiswa || !deadline) {
    return NextResponse.json({ error: "Nama event, target, dan deadline wajib diisi" }, { status: 400 });
  }

  const target = parseInt(target_per_mahasiswa, 10);
  if (isNaN(target) || target <= 0) {
    return NextResponse.json({ error: "Target harus angka positif" }, { status: 400 });
  }

  const isAllClasses = !kelas_id || kelas_id === "all";
  const actualKelasId = isAllClasses ? null : kelas_id;

  if (user.role === "admin") {
    if (isAllClasses || !actualKelasId || !canAccessKelas(user, actualKelasId)) {
      return NextResponse.json(
        { error: "Admin Prodi hanya berhak membuat event pada kelas di prodinya sendiri" },
        { status: 403 }
      );
    }
  }

  const grupId = crypto.randomUUID();
  const { runTransaction } = require("@/lib/db");

  let totalEnrolled = 0;
  runTransaction(() => {
    db.prepare(`
      INSERT INTO grup_tabungan (id, kelas_id, nama, target_per_mahasiswa, deadline, status)
      VALUES (?, ?, ?, ?, ?, 'aktif')
    `).run(grupId, actualKelasId, nama, target, deadline);

    // Enrol mahasiswa aktif (berdasarkan kelas atau semua kelas)
    const students = isAllClasses
      ? (db.prepare("SELECT id FROM users WHERE role = 'mahasiswa' AND aktif = 1").all() as any[])
      : (db.prepare("SELECT id FROM users WHERE kelas_id = ? AND role = 'mahasiswa' AND aktif = 1").all(actualKelasId) as any[]);

    totalEnrolled = students.length;
    for (const s of students) {
      db.prepare("INSERT OR IGNORE INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
        crypto.randomUUID(),
        grupId,
        s.id
      );
    }
  });

  logAudit(user.id, "BUAT_EVENT", grupId, `Event: ${nama}, Target: ${target}, Anggota: ${totalEnrolled}`);

  return NextResponse.json({ success: true, id: grupId, total_enrolled: totalEnrolled });
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, nama, target_per_mahasiswa, deadline, status } = await req.json();
  if (!id || !nama || !target_per_mahasiswa || !deadline) {
    return NextResponse.json({ error: "ID, Nama event, target, dan deadline wajib diisi" }, { status: 400 });
  }

  const target = parseInt(target_per_mahasiswa, 10);
  if (isNaN(target) || target <= 0) {
    return NextResponse.json({ error: "Target harus angka positif" }, { status: 400 });
  }

  const existing = db.prepare("SELECT * FROM grup_tabungan WHERE id = ?").get(id) as any;
  if (!existing) {
    return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  }

  if (user.role === "admin" && existing.kelas_id) {
    if (!canAccessKelas(user, existing.kelas_id)) {
      return NextResponse.json({ error: "Anda tidak berhak mengedit event kelas ini" }, { status: 403 });
    }
  }

  db.prepare(`
    UPDATE grup_tabungan 
    SET nama = ?, target_per_mahasiswa = ?, deadline = ?, status = COALESCE(?, status)
    WHERE id = ?
  `).run(nama, target, deadline, status || existing.status, id);

  logAudit(user.id, "EDIT_EVENT", id, `Event diubah: ${nama}, Target: ${target}, Deadline: ${deadline}`);

  return NextResponse.json({ success: true, message: "Event berhasil diperbarui" });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID event wajib disertakan" }, { status: 400 });
  }

  const existing = db.prepare("SELECT * FROM grup_tabungan WHERE id = ?").get(id) as any;
  if (!existing) {
    return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  }

  if (user.role === "admin" && existing.kelas_id) {
    if (!canAccessKelas(user, existing.kelas_id)) {
      return NextResponse.json({ error: "Anda tidak berhak menghapus event kelas ini" }, { status: 403 });
    }
  }

  // Check if there are successful transactions in this event
  const transCount = db.prepare(`
    SELECT COUNT(*) as count 
    FROM transaksi t 
    JOIN keanggotaan kg ON t.keanggotaan_id = kg.id 
    WHERE kg.grup_id = ? AND t.status = 'berhasil'
  `).get(id) as any;

  if (transCount?.count > 0) {
    return NextResponse.json(
      { error: "Event ini sudah memiliki transaksi kas masuk yang berhasil dan tidak dapat dihapus demi audit keuangan." },
      { status: 400 }
    );
  }

  db.prepare("DELETE FROM keanggotaan WHERE grup_id = ?").run(id);
  db.prepare("DELETE FROM grup_tabungan WHERE id = ?").run(id);

  logAudit(user.id, "HAPUS_EVENT", id, `Event dihapus: ${existing.nama}`);

  return NextResponse.json({ success: true, message: "Event berhasil dihapus" });
}
