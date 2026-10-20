import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const groups = db.prepare(`
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
