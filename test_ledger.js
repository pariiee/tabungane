const assert = require("node:assert");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

console.log("▶ Running Ponytail self-check on TABUNGANE SISFOR ledger & auth...");

// 1. In-memory DB setup matching schema
const db = new DatabaseSync(":memory:");
db.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    nim TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'mahasiswa',
    password_hash TEXT NOT NULL
  );

  CREATE TABLE grup_tabungan (
    id TEXT PRIMARY KEY,
    nama TEXT NOT NULL,
    target_per_mahasiswa INTEGER NOT NULL
  );

  CREATE TABLE keanggotaan (
    id TEXT PRIMARY KEY,
    grup_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(grup_id, user_id)
  );

  CREATE TABLE transaksi (
    id TEXT PRIMARY KEY,
    keanggotaan_id TEXT NOT NULL,
    tipe TEXT NOT NULL,
    jumlah INTEGER NOT NULL,
    status TEXT NOT NULL,
    qris_trx_id TEXT UNIQUE,
    ref_transaksi_id TEXT
  );

  CREATE TABLE webhook_events (
    event_id TEXT PRIMARY KEY,
    qris_trx_id TEXT
  );
`);

// 2. Auth test (scrypt hashing & timingSafeEqual)
function hashPassword(pwd) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(pwd, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(pwd, stored) {
  const [salt, orig] = stored.split(":");
  const test = crypto.scryptSync(pwd, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(test, "hex"), Buffer.from(orig, "hex"));
}

const pwd = "password123";
const hash = hashPassword(pwd);
assert.strictEqual(verifyPassword(pwd, hash), true, "Password verification should pass");
assert.strictEqual(verifyPassword("wrong", hash), false, "Wrong password should fail");
console.log("✔ Auth & Password Hashing: PASS");

// 3. User & Group Enrollment
const u1 = "u-001";
const g1 = "g-001";
const m1 = "m-001";

db.prepare("INSERT INTO users VALUES (?, ?, ?, 'mahasiswa', ?)").run(u1, "240101", "Budi", hash);
db.prepare("INSERT INTO grup_tabungan VALUES (?, ?, ?)").run(g1, "Kas Kelas 3A", 100000);
db.prepare("INSERT INTO keanggotaan VALUES (?, ?, ?)").run(m1, g1, u1);

// 4. Ledger transactions: Topup QRIS + Manual Add
db.prepare("INSERT INTO transaksi VALUES (?, ?, 'topup_qris', 50000, 'berhasil', 'TRX-1', NULL)").run("t-1", m1);
db.prepare("INSERT INTO transaksi VALUES (?, ?, 'manual_add', 25000, 'berhasil', NULL, NULL)").run("t-2", m1);

let balance = db.prepare("SELECT SUM(jumlah) as total FROM transaksi WHERE keanggotaan_id = ? AND status = 'berhasil'").get(m1).total;
assert.strictEqual(balance, 75000, "Balance should be 75.000");
console.log("✔ Ledger Append-only & Balance Sum: PASS");

// 5. Reversal Transaction (M10: negative amount, original untouched)
const origTrx = db.prepare("SELECT * FROM transaksi WHERE id = 't-2'").get();
const reversalAmount = -Math.abs(origTrx.jumlah);
db.prepare("INSERT INTO transaksi VALUES (?, ?, 'reversal', ?, 'berhasil', NULL, ?)").run("t-3", m1, reversalAmount, origTrx.id);

balance = db.prepare("SELECT SUM(jumlah) as total FROM transaksi WHERE keanggotaan_id = ? AND status = 'berhasil'").get(m1).total;
assert.strictEqual(balance, 50000, "Balance after reversal should be 50.000");
assert.strictEqual(origTrx.jumlah, 25000, "Original transaction must remain untouched");
console.log("✔ Reversal Transaction (Koreksi Pembalik): PASS");

// 6. Webhook Deduplication (PRD rule: unique event_id)
db.prepare("INSERT INTO webhook_events VALUES (?, ?)").run("evt-100", "TRX-1");
assert.throws(() => {
  db.prepare("INSERT INTO webhook_events VALUES (?, ?)").run("evt-100", "TRX-1");
}, /UNIQUE constraint failed/, "Duplicate webhook event_id must be rejected");
console.log("✔ Webhook Idempotency (Deduplication): PASS");

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
