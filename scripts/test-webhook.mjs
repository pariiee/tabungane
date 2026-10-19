/**
 * scripts/test-webhook.mjs
 * End-to-end automated test runner for Webhook Hardening & Idempotency
 * Run: node scripts/test-webhook.mjs
 */

import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const SECRET = "7e1c8ac2dbfca70f324dbd72a53f47beec9c00b6ec6e5da2";

// Connect to local DB to set up a test transaction and verify ledger directly
const dbPath = path.join(process.cwd(), "data", "tabungane.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA busy_timeout = 5000;");
db.exec("PRAGMA synchronous = NORMAL;");

db.exec("CREATE TABLE IF NOT EXISTS pengaturan (kunci TEXT PRIMARY KEY, nilai TEXT NOT NULL);");
db.prepare("INSERT INTO pengaturan (kunci, nilai) VALUES ('qriskuu_webhook_secret', ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai").run(SECRET);

function createSignature(bodyText, secret = SECRET) {
  const hash = crypto.createHmac("sha256", secret).update(bodyText).digest("hex");
  return `sha256=${hash}`;
}

async function sendWebhook(body, signatureHeader) {
  const res = await fetch(`${BASE_URL}/api/webhook`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signatureHeader ? { "x-webhook-signature": signatureHeader } : {}),
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, data: json };
}

async function runTests() {
  console.log("🧪 STARTING WEBHOOK & BACKEND HARDENING TEST SUITE...\n");

  // Setup: Find or create membership & test transaction
  let member = db.prepare("SELECT id FROM keanggotaan LIMIT 1").get();
  if (!member) {
    let user = db.prepare("SELECT id FROM users WHERE role = 'mahasiswa' LIMIT 1").get();
    let kelas = db.prepare("SELECT id FROM kelas LIMIT 1").get();
    if (!kelas) {
      kelas = { id: "test-kelas-1" };
      db.prepare("INSERT OR IGNORE INTO kelas (id, nama, tahun_ajaran) VALUES (?, '3A', '2026/2027')").run(kelas.id);
    }
    if (!user) {
      user = { id: "test-user-1" };
      db.prepare("INSERT OR IGNORE INTO users (id, nim, nama, role, kelas_id, password_hash) VALUES (?, '240999', 'Tester', 'mahasiswa', ?, 'dummy')").run(user.id, kelas.id);
    }
    let grup = db.prepare("SELECT id FROM grup_tabungan LIMIT 1").get();
    if (!grup) {
      grup = { id: "test-grup-1" };
      db.prepare("INSERT OR IGNORE INTO grup_tabungan (id, kelas_id, nama, target_per_mahasiswa, deadline) VALUES (?, ?, 'Kas Uji Coba', 100000, '2026-12-31')").run(grup.id, kelas.id);
    }
    const memId = "test-mem-1";
    db.prepare("INSERT OR IGNORE INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(memId, grup.id, user.id);
    member = { id: memId };
  }

  const testTrxId = `test_${Date.now()}`;
  const testQrisId = `qsim_${Math.random().toString(36).substring(2, 8)}`;
  const nominal = 25000;

  // Initial balance of membership
  const getBalance = () => {
    const row = db.prepare("SELECT COALESCE(SUM(jumlah), 0) as total FROM transaksi WHERE keanggotaan_id = ? AND status = 'berhasil'").get(member.id);
    return Number(row.total);
  };

  const balanceBefore = getBalance();

  // Insert pending transaction
  db.prepare(`
    INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, qris_trx_id, catatan)
    VALUES (?, ?, ?, 'topup_qris', ?, 'pending', ?, 'Test Topup')
  `).run(testTrxId, member.user_id || "test-user-1", member.id, nominal, testQrisId);

  console.log(`[SETUP] Created test pending transaction: ${testTrxId} (qris: ${testQrisId}, Rp ${nominal})`);

  // --- TEST 1: INVALID SIGNATURE REJECTION ---
  console.log("\n▶ TEST 1: Webhook with INVALID signature should return 401");
  const payload1 = JSON.stringify({
    event_id: `evt_${Date.now()}_1`,
    trxid: testQrisId,
    status: "paid",
    amount: nominal,
  });
  const res1 = await sendWebhook(payload1, "sha256=invalid_hash_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
  if (res1.status === 401) {
    console.log("✔ PASS: Invalid signature rejected with HTTP 401");
  } else {
    console.error(`❌ FAIL: Expected 401, got ${res1.status}:`, res1.data);
    process.exit(1);
  }

  // --- TEST 2: NOMINAL MISMATCH REJECTION ---
  console.log("\n▶ TEST 2: Webhook with MISMATCHED AMOUNT should be rejected");
  const eventIdMismatch = `evt_${Date.now()}_mismatch`;
  const payloadMismatch = JSON.stringify({
    event_id: eventIdMismatch,
    trxid: testQrisId,
    status: "paid",
    amount: nominal + 5000, // Bedakan 5000
  });
  const sigMismatch = createSignature(payloadMismatch);
  const resMismatch = await sendWebhook(payloadMismatch, sigMismatch);
  if (resMismatch.status === 400 && resMismatch.data?.error?.includes("tidak cocok")) {
    console.log("✔ PASS: Mismatched amount rejected with HTTP 400:", resMismatch.data.error);
  } else {
    console.error(`❌ FAIL: Expected 400 mismatch error, got ${resMismatch.status}:`, resMismatch.data);
    process.exit(1);
  }

  // Check balance unchanged
  if (getBalance() === balanceBefore) {
    console.log("✔ PASS: Balance was NOT incremented on mismatch");
  } else {
    console.error("❌ FAIL: Balance was unexpectedly modified!");
    process.exit(1);
  }

  // --- TEST 3: VALID WEBHOOK CREDIT ---
  console.log("\n▶ TEST 3: Webhook with VALID signature & amount should credit payment");
  const eventIdValid = `evt_${Date.now()}_valid`;
  const payloadValid = JSON.stringify({
    event_id: eventIdValid,
    trxid: testQrisId,
    status: "paid",
    amount: nominal,
  });
  const sigValid = createSignature(payloadValid);
  const resValid = await sendWebhook(payloadValid, sigValid);
  if (resValid.status === 200 && resValid.data?.success) {
    console.log("✔ PASS: Webhook processed successfully HTTP 200");
  } else {
    console.error(`❌ FAIL: Expected 200 success, got ${resValid.status}:`, resValid.data);
    process.exit(1);
  }

  const balanceAfter1 = getBalance();
  if (balanceAfter1 === balanceBefore + nominal) {
    console.log(`✔ PASS: Balance increased by exactly Rp ${nominal} (Before: ${balanceBefore}, After: ${balanceAfter1})`);
  } else {
    console.error(`❌ FAIL: Balance incorrect! Expected ${balanceBefore + nominal}, got ${balanceAfter1}`);
    process.exit(1);
  }

  // --- TEST 4: IDEMPOTENCY / DEDUPLICATION (REPLAY ATTACK) ---
  console.log("\n▶ TEST 4: Sending exact same webhook a second time (deduplication check)");
  const resReplay = await sendWebhook(payloadValid, sigValid);
  if (resReplay.status === 200 && resReplay.data?.duplicate) {
    console.log("✔ PASS: Webhook recognized as duplicate event and skipped (HTTP 200 duplicate: true)");
  } else {
    console.error(`❌ FAIL: Replay response unexpected:`, resReplay.data);
    process.exit(1);
  }

  const balanceAfterReplay = getBalance();
  if (balanceAfterReplay === balanceAfter1) {
    console.log(`✔ PASS: Balance remained unchanged on replay (Balance: Rp ${balanceAfterReplay})`);
  } else {
    console.error(`❌ FAIL: Balance was double-credited on replay! Got ${balanceAfterReplay}`);
    process.exit(1);
  }

  // Cleanup test transaction
  db.prepare("DELETE FROM transaksi WHERE id = ?").run(testTrxId);
  db.prepare("DELETE FROM webhook_events WHERE event_id IN (?, ?)").run(eventIdValid, eventIdMismatch);
  console.log("[CLEANUP] Test records cleaned up successfully.");

  console.log("\n🎉 ALL BACKEND HARDENING & WEBHOOK TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
