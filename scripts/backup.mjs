/**
 * scripts/backup.mjs
 * Automated SQLite hot-backup using VACUUM INTO
 * Retains 14 latest backups, removes older.
 *
 * Contoh cron harian di VPS (setiap jam 02:00 pagi WIB):
 * 0 2 * * * cd /var/www/tabungane && node scripts/backup.mjs >> /var/log/tabungane-backup.log 2>&1
 */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dataDbPath = path.join(projectRoot, "data", "tabungane.db");
const backupDir = path.join(projectRoot, "backups");

if (!fs.existsSync(dataDbPath)) {
  console.error("Database file not found at:", dataDbPath);
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
const backupFile = path.join(backupDir, `tabungane-${timestamp}.db`);

console.log(`[BACKUP] Creating snapshot: ${backupFile}...`);

try {
  const db = new DatabaseSync(dataDbPath);
  const escapedPath = backupFile.replace(/\\/g, "/");
  db.exec(`VACUUM INTO '${escapedPath}'`);
  db.close();
  console.log(`[BACKUP] Snapshot created successfully (${(fs.statSync(backupFile).size / 1024).toFixed(1)} KB)`);
} catch (err) {
  console.error("[BACKUP] Error running VACUUM INTO:", err);
  process.exit(1);
}

// Rotate: keep 14 latest, remove older
const files = fs
  .readdirSync(backupDir)
  .filter((f) => f.startsWith("tabungane-") && f.endsWith(".db"))
  .sort()
  .reverse();

if (files.length > 14) {
  const toDelete = files.slice(14);
  for (const f of toDelete) {
    fs.unlinkSync(path.join(backupDir, f));
    console.log(`[BACKUP] Pruned old backup: ${f}`);
  }
}

console.log(`[BACKUP] Status: ${Math.min(files.length, 14)} snapshot(s) retained.`);
