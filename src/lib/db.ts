import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "tabungane.db");

// Singleton instance across hot reloads
const globalForDb = global as unknown as { dbInstance?: DatabaseSync };

export const db: DatabaseSync = globalForDb.dbInstance || new DatabaseSync(dbPath);
if (process.env.NODE_ENV !== "production") {
  globalForDb.dbInstance = db;
}

// Set busy timeout first so multiple workers don't lock each other
db.exec("PRAGMA busy_timeout = 10000;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize tables once
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS kelas (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      tahun_ajaran TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nim TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'mahasiswa',
      kelas_id TEXT,
      password_hash TEXT NOT NULL,
      must_change_password INTEGER DEFAULT 0,
      aktif INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS grup_tabungan (
      id TEXT PRIMARY KEY,
      kelas_id TEXT NOT NULL,
      nama TEXT NOT NULL,
      target_per_mahasiswa INTEGER NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS keanggotaan (
      id TEXT PRIMARY KEY,
      grup_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(grup_id, user_id),
      FOREIGN KEY (grup_id) REFERENCES grup_tabungan(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transaksi (
      id TEXT PRIMARY KEY,
      keanggotaan_id TEXT NOT NULL,
      tipe TEXT NOT NULL,
      jumlah INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      qris_trx_id TEXT UNIQUE,
      channel TEXT,
      ref_transaksi_id TEXT,
      catatan TEXT,
      dibuat_oleh TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expired_at DATETIME,
      paid_at DATETIME,
      FOREIGN KEY (keanggotaan_id) REFERENCES keanggotaan(id) ON DELETE CASCADE,
      FOREIGN KEY (ref_transaksi_id) REFERENCES transaksi(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      event_id TEXT PRIMARY KEY,
      qris_trx_id TEXT,
      diterima_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
      ringkasan_payload TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      aksi TEXT NOT NULL,
      target TEXT NOT NULL,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pengaturan (
      kunci TEXT PRIMARY KEY,
      nilai TEXT NOT NULL
    );
  `);
} catch (e) {
  // If another worker is already initializing, ignore
}

export function getSetting(kunci: string): string | null {
  try {
    const row = db.prepare("SELECT nilai FROM pengaturan WHERE kunci = ?").get(kunci) as any;
    return row ? row.nilai : null;
  } catch {
    return null;
  }
}

export function setSetting(kunci: string, nilai: string): void {
  try {
    db.prepare("INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai").run(kunci, nilai);
  } catch (err) {
    console.error("setSetting error:", err);
  }
}
