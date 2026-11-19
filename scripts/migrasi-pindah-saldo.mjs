/**
 * scripts/migrasi-pindah-saldo.mjs
 *
 * Ubah pasangan PINDAH KANTONG lama (manual_deduct −X  ⇄  manual_add +X, user sama, waktu ≤ ~10 menit)
 * menjadi tipe sendiri: transfer_out / transfer_in. Setoran tunai sungguhan TIDAK disentuh.
 *
 * Kenapa manual_deduct+manual_add: fitur "pindah" dulu menumpang 2 tipe setoran, sehingga
 * leaderboard (api/leaderboard) ikut menghitung +X sebagai tabungan padahal cuma pindah kantong.
 *
 * Aturan pasangan (dipilih di sini, karena ambigu — lihat laporan dry-run):
 *   - user sama, selisih waktu ≤ 600 detik
 *   - satu negatif (manual_deduct), satu positif (manual_add), nominal sama
 *   - satu tanpa keanggotaan (sumber dompet), satu dengan keanggotaan (tujuan event)
 *
 * Pakai:
 *   node scripts/migrasi-pindah-saldo.mjs                 # DRY RUN (default, tidak menulis)
 *   node scripts/migrasi-pindah-saldo.mjs --apply         # tulis ke DB
 *   node scripts/migrasi-pindah-saldo.mjs --db /path/db   # DB lain (default data/tabungane.db)
 */
import { DatabaseSync } from "node:sqlite";
import { existsSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
const dbIdx = argv.indexOf("--db");
const dbPath = dbIdx !== -1 ? argv[dbIdx + 1] : path.join(process.cwd(), "data", "tabungane.db");

if (!existsSync(dbPath)) {
  console.error("ABORT: DB tidak ditemukan:", dbPath);
  process.exit(1);
}

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA busy_timeout = 5000;");

const JENDELA_DETIK = 600; // pasangan pindah harus terjadi dalam 10 menit

const rows = db
  .prepare(
    `SELECT t.id, t.user_id, u.nama, u.nim, t.tipe, t.jumlah, t.keanggotaan_id, t.created_at, t.paid_at, t.catatan
     FROM transaksi t JOIN users u ON u.id = t.user_id
     WHERE t.tipe IN ('manual_add','manual_deduct') AND t.status = 'berhasil'
     ORDER BY t.user_id, datetime(COALESCE(t.paid_at, t.created_at)) ASC`
  )
  .all();

const epoch = (r) => {
  const s = String(r.paid_at || r.created_at || "").replace(" ", "T");
  const d = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) ? s : s + "Z");
  return isNaN(d.getTime()) ? 0 : Math.floor(d.getTime() / 1000);
};

const dipakai = new Set();
const pasangan = [];

for (let i = 0; i < rows.length; i++) {
  const out = rows[i];
  if (dipakai.has(out.id)) continue;
  if (out.tipe !== "manual_deduct" || Number(out.jumlah) >= 0) continue;

  const nominal = Math.abs(Number(out.jumlah));
  let best = null;
  for (let j = 0; j < rows.length; j++) {
    const inn = rows[j];
    if (inn.id === out.id || dipakai.has(inn.id)) continue;
    if (inn.user_id !== out.user_id) continue;
    if (inn.tipe !== "manual_add" || Number(inn.jumlah) !== nominal) continue;
    const dt = epoch(inn) - epoch(out);
    if (dt < 0 || dt > JENDELA_DETIK) continue;
    // sumber dompet (tanpa keanggotaan) -> tujuan event (dengan keanggotaan), atau sebaliknya
    const bedaKantong = (out.keanggotaan_id === null) !== (inn.keanggotaan_id === null);
    if (!bedaKantong) continue;
    if (!best || dt < best.dt) best = { row: inn, dt };
  }
  if (best) {
    dipakai.add(out.id);
    dipakai.add(best.row.id);
    pasangan.push({ out, inn: best.row, nominal, jedaDetik: best.dt });
  }
}

const sisaMinus = rows.filter((r) => r.tipe === "manual_deduct" && !dipakai.has(r.id));

console.log("DB:", dbPath);
console.log("Mode:", APPLY ? "APPLY (menulis)" : "DRY RUN (tidak menulis)");
console.log(`Total manual_add/manual_deduct berhasil: ${rows.length}`);
console.log(`Pasangan pindah terdeteksi: ${pasangan.length}\n`);

for (const p of pasangan) {
  console.log(
    `  ${p.out.nama} (${p.out.nim})  Rp${p.nominal.toLocaleString("id-ID")}  jeda ${p.jedaDetik}s`
  );
  console.log(`     out ${p.out.id}  ${p.out.created_at}  "${p.out.catatan}"`);
  console.log(`     in  ${p.inn.id}  ${p.inn.created_at}  "${p.inn.catatan}"`);
}

if (sisaMinus.length > 0) {
  console.log("\n--- manual_deduct TANPA pasangan (biarkan sebagai pengurangan, bukan pindah) ---");
  for (const r of sisaMinus) {
    console.log(`  ${r.nama} (${r.nim}) Rp${Math.abs(Number(r.jumlah)).toLocaleString("id-ID")} ${r.created_at} "${r.catatan}"`);
  }
}

console.log("\n--- Efek ke leaderboard (periode bulan berjalan & tahun ini) ---");
const bulanIni = db
  .prepare(
    `SELECT COALESCE(SUM(CASE WHEN tipe='manual_add' THEN jumlah ELSE 0 END),0) as terhitung
     FROM transaksi
     WHERE status='berhasil' AND tipe IN ('topup_qris','manual_add','setoran_tunai')
       AND STRFTIME('%Y-%m', COALESCE(paid_at,created_at), 'localtime') = STRFTIME('%Y-%m','now','localtime')`
  )
  .get();
const akanKeluar = pasangan
  .filter((p) => String(p.inn.paid_at || p.inn.created_at).startsWith(new Date().toISOString().slice(0, 7)))
  .reduce((a, p) => a + p.nominal, 0);
console.log(`  Saat ini terhitung: Rp${Number(bulanIni.terhitung).toLocaleString("id-ID")}`);
console.log(`  Akan dikeluarkan   : Rp${akanKeluar.toLocaleString("id-ID")}`);

if (!APPLY) {
  console.log("\nDRY RUN selesai. Jalankan ulang dengan --apply untuk menulis.");
  process.exit(0);
}

const upd = db.prepare("UPDATE transaksi SET tipe = ? WHERE id = ?");
const seen = db.prepare("SELECT tipe FROM transaksi WHERE id = ?");

db.exec("BEGIN IMMEDIATE");
try {
  let n = 0;
  for (const p of pasangan) {
    upd.run("transfer_out", p.out.id);
    upd.run("transfer_in", p.inn.id);
    n += 2;
  }
  // Verifikasi di dalam transaksi sebelum commit
  for (const p of pasangan) {
    const a = seen.get(p.out.id)?.tipe;
    const b = seen.get(p.inn.id)?.tipe;
    if (a !== "transfer_out" || b !== "transfer_in") {
      throw new Error(`Verifikasi gagal untuk ${p.out.id} / ${p.inn.id}: ${a} / ${b}`);
    }
  }
  db.exec("COMMIT");
  console.log(`\nSELESAI: ${n} baris diubah (${pasangan.length} pasangan).`);
} catch (e) {
  db.exec("ROLLBACK");
  console.error("\nROLLBACK:", e.message);
  process.exit(1);
}

const cek = db
  .prepare(
    `SELECT tipe, COUNT(*) n FROM transaksi WHERE tipe IN ('transfer_in','transfer_out','manual_add','manual_deduct') GROUP BY tipe`
  )
  .all();
console.log("Distribusi tipe sekarang:");
for (const r of cek) console.log(`  ${r.tipe}: ${r.n}`);
