import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "data", "tabungane.db");
const db = new DatabaseSync(dbPath);

console.log("🧹 Resetting Tabungane SISFOR database to clean production state...");

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

db.exec("PRAGMA foreign_keys = OFF;");

// Clear all test data
const tables = [
  "transaksi",
  "pengajuan_penarikan",
  "kantong",
  "keanggotaan",
  "grup_tabungan",
  "webhook_events",
  "audit_log",
  "login_attempts",
  "users",
  "kelas",
];

for (const t of tables) {
  try {
    db.exec(`DELETE FROM ${t};`);
  } catch (err) {
    console.warn(`Table ${t} warning:`, err.message);
  }
}

// Master Fakultas & Prodi defaults
try {
  const existingFak = db.prepare("SELECT id FROM fakultas WHERE kode = 'FILKOM'").get();
  if (!existingFak) {
    db.prepare("INSERT INTO fakultas (id, nama, kode) VALUES ('fak-ilkom', 'Fakultas Ilmu Komputer', 'FILKOM')").run();
  }
  const existingProdi = db.prepare("SELECT id FROM prodi WHERE kode = 'SI'").get();
  if (!existingProdi) {
    db.prepare("INSERT INTO prodi (id, fakultas_id, nama, kode, fakultas) VALUES ('prodi-si', 'fak-ilkom', 'Sistem Informasi', 'SI', 'Fakultas Ilmu Komputer')").run();
  }
} catch (e) {
  console.warn("Fakultas/Prodi init:", e.message);
}

// Create 1 single Super Admin account
const adminId = crypto.randomUUID();
const adminHash = hashPassword("admin123");
db.prepare(`
  INSERT INTO users (id, nim, nama, role, password_hash, must_change_password, aktif)
  VALUES (?, 'admin', 'Super Admin', 'super_admin', ?, 0, 1)
`).run(adminId, adminHash);

db.exec("PRAGMA foreign_keys = ON;");
db.exec("VACUUM;");

const counts = {
  users: db.prepare("SELECT COUNT(*) as c FROM users").get().c,
  kelas: db.prepare("SELECT COUNT(*) as c FROM kelas").get().c,
  grup: db.prepare("SELECT COUNT(*) as c FROM grup_tabungan").get().c,
  transaksi: db.prepare("SELECT COUNT(*) as c FROM transaksi").get().c,
  kantong: db.prepare("SELECT COUNT(*) as c FROM kantong").get().c,
  super_admin: db.prepare("SELECT nim, nama, role FROM users WHERE role = 'super_admin'").get(),
};

console.log("✅ Database reset complete!");
console.log("📊 Summary:", JSON.stringify(counts, null, 2));
