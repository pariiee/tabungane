import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (process.env.NODE_ENV === "production") {
  console.error("❌ Refusing to run seed-dev.mjs in production environment!");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "..", "data", "tabungane.db");
const db = new DatabaseSync(dbPath);

console.log("🌱 Running development seed for Tabungane SISFOR...");

// Hash helper
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const defaultHash = hashPassword("123456");

// 1. Create 1 Kelas
const kelasId = crypto.randomUUID();
const existingKelas = db.prepare("SELECT id FROM kelas WHERE nama = 'SI-2026'").get();
const finalKelasId = existingKelas ? existingKelas.id : kelasId;

if (!existingKelas) {
  db.prepare(`
    INSERT INTO kelas (id, nama, tahun_ajaran)
    VALUES (?, 'SI-2026', '2026/2027')
  `).run(finalKelasId);
  console.log("✔ Created Kelas: SI-2026");
}

// 2. Create 1 Grup Tabungan
const grupId = crypto.randomUUID();
const existingGrup = db.prepare("SELECT id FROM grup_tabungan WHERE nama = 'Tabungan Study Tour Bali'").get();
const finalGrupId = existingGrup ? existingGrup.id : grupId;

if (!existingGrup) {
  const deadline = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO grup_tabungan (id, nama, target_per_mahasiswa, deadline, kelas_id, status)
    VALUES (?, 'Tabungan Study Tour Bali', 500000, ?, ?, 'aktif')
  `).run(finalGrupId, deadline, finalKelasId);
  console.log("✔ Created Grup: Tabungan Study Tour Bali");
}

// 3. Create 12 Dummy Mahasiswa with varied balances
const dummyStudents = [
  { nim: "2601001", nama: "Aditya Pratama", saldo: 1250000, public: 1 },
  { nim: "2601002", nama: "Bella Safitri", saldo: 980000, public: 1 },
  { nim: "2601003", nama: "Citra Lestari", saldo: 750000, public: 0 },
  { nim: "2601004", nama: "Dimas Anggara", saldo: 620000, public: 1 },
  { nim: "2601005", nama: "Eka Rahmawati", saldo: 500000, public: 1 },
  { nim: "2601006", nama: "Fajar Nugraha", saldo: 450000, public: 0 },
  { nim: "2601007", nama: "Gita Gutawa", saldo: 380000, public: 1 },
  { nim: "2601008", nama: "Hendra Wijaya", saldo: 300000, public: 1 },
  { nim: "2601009", nama: "Intan Permata", saldo: 250000, public: 0 },
  { nim: "2601010", nama: "Joko Santoso", saldo: 180000, public: 1 },
  { nim: "2601011", nama: "Kiki Amalia", saldo: 120000, public: 1 },
  { nim: "2601012", nama: "Lutfi Hakim", saldo: 75000, public: 0 },
];

for (const s of dummyStudents) {
  let userRow = db.prepare("SELECT id FROM users WHERE nim = ?").get(s.nim);
  let uid = userRow ? userRow.id : crypto.randomUUID();

  if (!userRow) {
    db.prepare(`
      INSERT INTO users (id, nim, nama, role, password_hash, kelas_id, aktif, tampilkan_saldo_leaderboard)
      VALUES (?, ?, ?, 'mahasiswa', ?, ?, 1, ?)
    `).run(uid, s.nim, s.nama, defaultHash, finalKelasId, s.public);
  } else {
    db.prepare("UPDATE users SET nama = ?, tampilkan_saldo_leaderboard = ? WHERE id = ?").run(s.nama, s.public, uid);
  }

  // Ensure Keanggotaan
  let member = db.prepare("SELECT id FROM keanggotaan WHERE grup_id = ? AND user_id = ?").get(finalGrupId, uid);
  let memberId = member ? member.id : crypto.randomUUID();

  if (!member) {
    db.prepare(`
      INSERT INTO keanggotaan (id, grup_id, user_id)
      VALUES (?, ?, ?)
    `).run(memberId, finalGrupId, uid);
  }

  // Add initial transaction if student has 0 transactions
  const trxCount = db.prepare("SELECT COUNT(*) as c FROM transaksi WHERE user_id = ? AND status = 'berhasil'").get(uid);
  if (trxCount.c === 0) {
    const trxId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transaksi (id, user_id, keanggotaan_id, tipe, jumlah, status, catatan, dibuat_oleh)
      VALUES (?, ?, ?, 'manual_add', ?, 'berhasil', 'Setoran Awal Tabungan Dev', 'seed')
    `).run(trxId, uid, memberId, s.saldo);
  }
}

console.log("🎉 Development seed finished! 12 dummy students and transactions ready.");
