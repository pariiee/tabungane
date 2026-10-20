import { db } from "./db";
import { hashPassword } from "./auth";
import crypto from "node:crypto";

export function ensureSeedData() {
  const adminCheck = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE nim = 'admin' OR role IN ('admin', 'super_admin')")
    .get() as any;
  if (adminCheck && adminCheck.count > 0) {
    return;
  }

  console.log("Seeding initial database...");
  const adminId = crypto.randomUUID();
  const adminHash = hashPassword("admin123");
  db.prepare(
    "INSERT INTO users (id, nim, nama, role, password_hash, must_change_password, aktif) VALUES (?, ?, ?, ?, ?, ?, 1)"
  ).run(adminId, "admin", "Super Admin Sisfor", "admin", adminHash, 0);

  // Sample Kelas
  const kelasId = crypto.randomUUID();
  db.prepare("INSERT INTO kelas (id, nama, tahun_ajaran) VALUES (?, ?, ?)").run(kelasId, "3A", "2026/2027");

  // Sample Mahasiswa
  const mhsId = crypto.randomUUID();
  const mhsHash = hashPassword("password123");
  db.prepare(
    "INSERT INTO users (id, nim, nama, role, kelas_id, password_hash, must_change_password, aktif) VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
  ).run(mhsId, "240101", "Budi Santoso", "mahasiswa", kelasId, mhsHash, 1);

  // Sample Grup
  const grupId = crypto.randomUUID();
  const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  db.prepare(
    "INSERT INTO grup_tabungan (id, kelas_id, nama, target_per_mahasiswa, deadline, status) VALUES (?, ?, ?, ?, ?, 'aktif')"
  ).run(grupId, kelasId, "Study Tour & Kunjungan Industri 2026", 150000, deadline);

  // Sample Keanggotaan
  const memberId = crypto.randomUUID();
  db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(memberId, grupId, mhsId);

  // Sample Initial Transaksi (Manual Setoran Awal Rp25.000)
  const trxId = crypto.randomUUID();
  db.prepare(
    "INSERT INTO transaksi (id, keanggotaan_id, tipe, jumlah, status, catatan, dibuat_oleh) VALUES (?, ?, 'manual_add', 25000, 'berhasil', 'Setoran tunai awal', 'Super Admin Sisfor')"
  ).run(trxId, memberId);

  console.log("Seed data ready!");
}

ensureSeedData();
