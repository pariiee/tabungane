/**
 * scripts/uji-migrasi-pindah.mjs
 * Self-check untuk logika migrasi-pindah-saldo.mjs. Pakai DB sementara, tidak menyentuh data asli.
 *   node scripts/uji-migrasi-pindah.mjs
 */
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const dir = mkdtempSync(path.join(tmpdir(), "uji-migrasi-"));
const dbPath = path.join(dir, "uji.db");

const db = new DatabaseSync(dbPath);
db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, nama TEXT, nim TEXT);
  CREATE TABLE transaksi (
    id TEXT PRIMARY KEY, user_id TEXT, keanggotaan_id TEXT, tipe TEXT,
    jumlah INTEGER, status TEXT, created_at TEXT, paid_at TEXT, catatan TEXT
  );
  INSERT INTO users VALUES ('u1','Rara','26160018'), ('u2','Siti','26160019');
`);

const ins = db.prepare(
  "INSERT INTO transaksi (id,user_id,keanggotaan_id,tipe,jumlah,status,created_at,paid_at,catatan) VALUES (?,?,?,?,?, 'berhasil',?,?,?)"
);
const T = (mins) => {
  const total = 10 * 60 + mins; // detik→menit dari 01:00
  const hh = String(1 + Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `2026-11-03 ${hh}:${mm}:00`;
};

// KASUS 1: pasangan pindah — dompet(no member) -> event(member), jeda 6 menit  ← HARUS jadi transfer_*
ins.run("a-out", "u1", null, "manual_deduct", -173000, T(0), T(0), "pindah ke kas");
ins.run("a-in", "u1", "mem-1", "manual_add", 173000, T(6), T(6), "pindah ke kas");

// KASUS 2: setoran tunai TUNGGAL (tanpa pasangan)  ← HARUS TETAP manual_add
ins.run("b-in", "u2", "mem-2", "manual_add", 50000, T(20), T(20), "setor tunai bendahara");

// KASUS 3: pengurangan TUNGGAL  ← HARUS TETAP manual_deduct
ins.run("c-out", "u2", null, "manual_deduct", -30000, T(30), T(30), "koreksi salah input");

// KASUS 4: nominal beda (bukan pasangan)  ← HARUS TETAP
ins.run("d-out", "u1", null, "manual_deduct", -10000, T(40), T(40), "tarik");
ins.run("d-in", "u1", "mem-1", "manual_add", 8888, T(41), T(41), "tarik");

// KASUS 5: jeda 1 jam (bukan pasangan)  ← HARUS TETAP
ins.run("e-out", "u1", null, "manual_deduct", -7000, "2026-11-04 01:00:00", "2026-11-04 01:00:00", "lama");
ins.run("e-in", "u1", "mem-1", "manual_add", 7000, "2026-11-04 02:00:00", "2026-11-04 02:00:00", "lama");

// KASUS 6: dua-duanya tanpa keanggotaan (bukan perpindahan kantong)  ← HARUS TETAP
ins.run("f-out", "u1", null, "manual_deduct", -5000, T(50), T(50), "x");
ins.run("f-in", "u1", null, "manual_add", 5000, T(51), T(51), "x");

// KASUS 7: satu-satunya setoran tunai asli user u1, untuk cek leaderboard tetap menghitungnya
ins.run("g-in", "u1", "mem-1", "manual_add", 9999, T(59), T(59), "setor tunai asli");

db.close();

const script = path.join(process.cwd(), "scripts", "migrasi-pindah-saldo.mjs");
const run = (extra = []) => {
  try {
    return execFileSync("node", [script, "--db", dbPath, ...extra], { encoding: "utf8" });
  } catch (e) {
    return String(e.stdout || "") + String(e.stderr || "");
  }
};

let gagal = 0;
const ok = (cond, msg) => {
  console.log((cond ? "PASS: " : "FAIL: ") + msg);
  if (!cond) gagal++;
};

// --- DRY RUN dulu: tidak boleh mengubah apa pun ---
const dry = run();
ok(/Pasangan pindah terdeteksi: 1/.test(dry), "dry-run mendeteksi tepat 1 pasangan");
const c1 = new DatabaseSync(dbPath);
ok(c1.prepare("SELECT tipe FROM transaksi WHERE id='a-out'").get().tipe === "manual_deduct",
   "dry-run TIDAK mengubah DB");
c1.close();

// --- APPLY ---
const out = run(["--apply"]);
console.log(out.split("\n").filter((l) => /SELESAI|ROLLBACK/.test(l)).join("\n"));

const c = new DatabaseSync(dbPath);
const tipeOf = (id) => c.prepare("SELECT tipe FROM transaksi WHERE id=?").get(id)?.tipe;

ok(tipeOf("a-out") === "transfer_out", "pasangan keluar -> transfer_out (Rara)");
ok(tipeOf("a-in") === "transfer_in", "pasangan masuk -> transfer_in (Rara)");
ok(tipeOf("b-in") === "manual_add", "setoran tunai tunggal TETAP manual_add");
ok(tipeOf("c-out") === "manual_deduct", "pengurangan tunggal TETAP manual_deduct");
ok(tipeOf("d-out") === "manual_deduct" && tipeOf("d-in") === "manual_add", "nominal beda TIDAK dipasangkan");
ok(tipeOf("e-out") === "manual_deduct" && tipeOf("e-in") === "manual_add", "jeda 1 jam TIDAK dipasangkan");
ok(tipeOf("f-out") === "manual_deduct" && tipeOf("f-in") === "manual_add", "dua-duanya dompet TIDAK dipasangkan");

// Inti perbaikan: leaderboard tidak lagi menghitung pindah saldo.
// Yang tersisa terhitung untuk u1 = d-in 8888 + e-in 7000 + f-in 5000 + g-in 9999 = 30887.
// Kalau a-in (173000) ikut terhitung, hasilnya 203887 — itulah yang harus dicegah.
const lb = c
  .prepare(
    `SELECT COALESCE(SUM(jumlah),0) v FROM transaksi
     WHERE status='berhasil' AND tipe IN ('topup_qris','manual_add','setoran_tunai') AND user_id='u1'`
  )
  .get();
ok(Number(lb.v) === 30887, `leaderboard u1 = 30887 (pindah 173000 TIDAK ikut), BUKAN 203887 (kena: ${lb.v})`);

// cek keterjangkauan
const cnt = (t) => c.prepare("SELECT COUNT(*) n FROM transaksi WHERE tipe=?").get(t).n;
const sumT = (t) => c.prepare("SELECT COALESCE(SUM(jumlah),0) v FROM transaksi WHERE tipe=?").get(t).v;
const semua = JSON.stringify(c.prepare("SELECT id,tipe,jumlah FROM transaksi WHERE user_id='u1'").all());
if (process.env.DEBUG) console.log(`DEBUG manual_add n=${cnt("manual_add")} sum=${sumT("manual_add")} | transfer_in n=${cnt("transfer_in")} | rows=${semua}`);

// Idempoten: jalankan lagi tidak boleh mengubah apa pun
const sebelum = c.prepare("SELECT COUNT(*) n FROM transaksi WHERE tipe LIKE 'transfer_%'").get().n;
c.close();
const ulang = run(["--apply"]);
const c2 = new DatabaseSync(dbPath);
ok(c2.prepare("SELECT COUNT(*) n FROM transaksi WHERE tipe LIKE 'transfer_%'").get().n === sebelum,
   "jalan kedua idempoten (tidak menambah pasangan baru)");
c2.close();

rmSync(dir, { recursive: true, force: true });
console.log(gagal === 0 ? "\nSEMUA CHECK LULUS" : `\n${gagal} CHECK GAGAL`);
process.exit(gagal === 0 ? 0 : 1);
