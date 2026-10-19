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

// Set pragmas per specification:
// PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA synchronous=NORMAL;
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA synchronous = NORMAL;");

// Safe transaction helper with BEGIN IMMEDIATE ... COMMIT / ROLLBACK
export function runTransaction<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE;");
  try {
    const result = fn();
    db.exec("COMMIT;");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK;");
    } catch {}
    throw err;
  }
}

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
      kelas_id TEXT,
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
      user_id TEXT NOT NULL,
      keanggotaan_id TEXT,
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
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
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

    CREATE TABLE IF NOT EXISTS login_attempts (
      key TEXT PRIMARY KEY,
      attempts INTEGER NOT NULL DEFAULT 1,
      first_attempt INTEGER NOT NULL,
      locked_until INTEGER NOT NULL DEFAULT 0
    );

    -- Ensure explicit UNIQUE indexes for strict constraint enforcement
    CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_qris_trx_id ON transaksi(qris_trx_id) WHERE qris_trx_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_keanggotaan_grup_user ON keanggotaan(grup_id, user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
  `);

  // Auto-migration for wallet schema
  try {
    const cols = db.prepare("PRAGMA table_info(transaksi)").all() as any[];
    const userCol = cols.find((c) => c.name === "user_id");
    const memberCol = cols.find((c) => c.name === "keanggotaan_id");
    if (!userCol || (memberCol && memberCol.notnull === 1)) {
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE IF NOT EXISTS transaksi_v2 (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          keanggotaan_id TEXT,
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
          paid_at DATETIME
        );
        INSERT INTO transaksi_v2 (id, user_id, keanggotaan_id, tipe, jumlah, status, qris_trx_id, channel, ref_transaksi_id, catatan, dibuat_oleh, created_at, expired_at, paid_at)
        SELECT t.id, COALESCE(k.user_id, ''), t.keanggotaan_id, t.tipe, t.jumlah, t.status, t.qris_trx_id, t.channel, t.ref_transaksi_id, t.catatan, t.dibuat_oleh, t.created_at, t.expired_at, t.paid_at
        FROM transaksi t
        LEFT JOIN keanggotaan k ON t.keanggotaan_id = k.id;
        DROP TABLE transaksi;
        ALTER TABLE transaksi_v2 RENAME TO transaksi;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_transaksi_qris_trx_id ON transaksi(qris_trx_id) WHERE qris_trx_id IS NOT NULL;
        PRAGMA foreign_keys=ON;
      `);
    }

    const gCols = db.prepare("PRAGMA table_info(grup_tabungan)").all() as any[];
    const kCol = gCols.find((c) => c.name === "kelas_id");
    if (kCol && kCol.notnull === 1) {
      db.exec(`
        PRAGMA foreign_keys=OFF;
        CREATE TABLE IF NOT EXISTS grup_tabungan_v2 (
          id TEXT PRIMARY KEY,
          kelas_id TEXT,
          nama TEXT NOT NULL,
          target_per_mahasiswa INTEGER NOT NULL,
          deadline TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'aktif',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
        );
        INSERT INTO grup_tabungan_v2 SELECT * FROM grup_tabungan;
        DROP TABLE grup_tabungan;
        ALTER TABLE grup_tabungan_v2 RENAME TO grup_tabungan;
        PRAGMA foreign_keys=ON;
      `);
    }
  } catch {}
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
