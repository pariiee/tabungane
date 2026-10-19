/**
 * scripts/test-wallet.mjs
 * Test suite for SAKU Pocket/Wallet (Dompet Utama, Alokasi Kas, Transfer P2P NIM)
 */

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import crypto from "node:crypto";

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const dbPath = path.join(process.cwd(), "data", "tabungane.db");
const db = new DatabaseSync(dbPath);
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");

console.log(`🧪 TESTING SAKU WALLET API AT ${BASE_URL}...\n`);

// Setup 2 test users with known password
const u1 = "test_user_a";
const u2 = "test_user_b";
const k1 = "test_kelas_wallet";
const g1 = "test_grup_wallet";

function makeHash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const pwdHash = makeHash("password123");

db.prepare("INSERT OR IGNORE INTO kelas (id, nama, tahun_ajaran) VALUES (?, '3X', '2026/2027')").run(k1);
db.prepare("INSERT OR REPLACE INTO users (id, nim, nama, role, kelas_id, password_hash, aktif, must_change_password) VALUES (?, 'NIM_A', 'Mahasiswa A', 'mahasiswa', ?, ?, 1, 0)").run(u1, k1, pwdHash);
db.prepare("INSERT OR REPLACE INTO users (id, nim, nama, role, kelas_id, password_hash, aktif, must_change_password) VALUES (?, 'NIM_B', 'Mahasiswa B', 'mahasiswa', ?, ?, 1, 0)").run(u2, k1, pwdHash);
db.prepare("INSERT OR REPLACE INTO grup_tabungan (id, kelas_id, nama, target_per_mahasiswa, deadline, status) VALUES (?, ?, 'Kas Kelompok', 50000, '2026-12-31', 'aktif')").run(g1, k1);

// Reset test balances and lockouts
db.prepare("DELETE FROM login_attempts").run();
db.prepare("DELETE FROM transaksi WHERE user_id IN (?, ?)").run(u1, u2);

async function login(nim, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nim, password }),
  });
  const cookie = res.headers.get("set-cookie");
  const data = await res.json();
  return { status: res.status, cookie, data };
}

async function runTests() {
  // Login as User A
  const authA = await login("NIM_A", "password123");
  if (!authA.cookie) {
    throw new Error(`Login NIM_A failed: ${JSON.stringify(authA.data)}`);
  }
  const cookieHeader = authA.cookie.split(";")[0];

  // 1. Get initial wallet balance
  console.log("▶ TEST 1: Check initial wallet balance");
  const resBal0 = await fetch(`${BASE_URL}/api/student/wallet`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());
  if (resBal0.balance === 0) {
    console.log("✔ PASS: Initial wallet balance is Rp 0");
  } else {
    throw new Error(`Expected 0, got ${resBal0.balance}`);
  }

  // 2. Simulate top up to Dompet Utama (+Rp 100.000)
  console.log("\n▶ TEST 2: Credit Rp 100.000 to Dompet Utama");
  db.prepare(`
    INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, paid_at)
    VALUES ('trx_test_wallet_100k', ?, NULL, 'topup_qris', 100000, 'berhasil', CURRENT_TIMESTAMP)
  `).run(u1);

  const resBal1 = await fetch(`${BASE_URL}/api/student/wallet`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());
  if (resBal1.balance === 100000) {
    console.log("✔ PASS: Balance updated to Rp 100.000");
  } else {
    throw new Error(`Expected 100000, got ${resBal1.balance}`);
  }

  // 3. Allocate Rp 35.000 to Group Kas
  console.log("\n▶ TEST 3: Allocate Rp 35.000 to Group Kas via /api/student/wallet/allocate");
  const resAlloc = await fetch(`${BASE_URL}/api/student/wallet/allocate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      grup_id: g1,
      amount: 35000,
      catatan: "Uang kas mingguan",
    }),
  }).then((r) => r.json());

  if (resAlloc.success && resAlloc.allocated === 35000) {
    console.log("✔ PASS: Allocation successful!");
  } else {
    throw new Error(`Allocation failed: ${JSON.stringify(resAlloc)}`);
  }

  const resBal2 = await fetch(`${BASE_URL}/api/student/wallet`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());
  if (resBal2.balance === 65000) {
    console.log("✔ PASS: Wallet deducted to Rp 65.000");
  } else {
    throw new Error(`Expected 65000, got ${resBal2.balance}`);
  }

  // 4. Transfer Rp 25.000 to NIM_B
  console.log("\n▶ TEST 4: Transfer Rp 25.000 to NIM_B via /api/student/wallet/transfer");
  const resTransfer = await fetch(`${BASE_URL}/api/student/wallet/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      target_nim: "NIM_B",
      amount: 25000,
      catatan: "Bayar makan siang",
    }),
  }).then((r) => r.json());

  if (resTransfer.success && resTransfer.transferred === 25000) {
    console.log(`✔ PASS: Transfer successful to ${resTransfer.target_nama}!`);
  } else {
    throw new Error(`Transfer failed: ${JSON.stringify(resTransfer)}`);
  }

  // Check remaining balance A
  const resBal3 = await fetch(`${BASE_URL}/api/student/wallet`, {
    headers: { Cookie: cookieHeader },
  }).then((r) => r.json());
  if (resBal3.balance === 40000) {
    console.log("✔ PASS: NIM_A remaining wallet balance is Rp 40.000 (100k - 35k - 25k)");
  } else {
    throw new Error(`Expected 40000, got ${resBal3.balance}`);
  }

  // Login as User B to check received balance
  const authB = await login("NIM_B", "password123");
  const cookieB = authB.cookie.split(";")[0];
  const resBalB = await fetch(`${BASE_URL}/api/student/wallet`, {
    headers: { Cookie: cookieB },
  }).then((r) => r.json());
  if (resBalB.balance === 25000) {
    console.log("✔ PASS: NIM_B received exactly Rp 25.000!");
  } else {
    throw new Error(`Expected 25000 for NIM_B, got ${resBalB.balance}`);
  }

  // 5. Test transfer to own NIM
  console.log("\n▶ TEST 5: Self-transfer rejection");
  const resSelf = await fetch(`${BASE_URL}/api/student/wallet/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      target_nim: "NIM_A",
      amount: 5000,
    }),
  });
  if (resSelf.status === 400) {
    const err = await resSelf.json();
    console.log("✔ PASS: Self-transfer rejected HTTP 400:", err.error);
  } else {
    throw new Error(`Expected 400, got ${resSelf.status}`);
  }

  // 6. Test insufficient balance
  console.log("\n▶ TEST 6: Insufficient balance rejection");
  const resOver = await fetch(`${BASE_URL}/api/student/wallet/transfer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      target_nim: "NIM_B",
      amount: 9999999,
    }),
  });
  if (resOver.status === 400) {
    const err = await resOver.json();
    console.log("✔ PASS: Insufficient balance rejected HTTP 400:", err.error);
  } else {
    throw new Error(`Expected 400, got ${resOver.status}`);
  }

  // Cleanup
  db.prepare("DELETE FROM transaksi WHERE user_id IN (?, ?)").run(u1, u2);
  db.prepare("DELETE FROM keanggotaan WHERE user_id IN (?, ?)").run(u1, u2);
  db.prepare("DELETE FROM users WHERE id IN (?, ?)").run(u1, u2);
  db.prepare("DELETE FROM grup_tabungan WHERE id = ?").run(g1);
  db.prepare("DELETE FROM kelas WHERE id = ?").run(k1);

  console.log("\n🎉 ALL SAKU WALLET API TESTS PASSED 100%!");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
