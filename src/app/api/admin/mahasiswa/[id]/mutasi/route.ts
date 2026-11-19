import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessMahasiswa } from "@/lib/scope";

/**
 * GET /api/admin/mahasiswa/[id]/mutasi?tipe=masuk|keluar&page=1
 * Riwayat transaksi SAKU (dompet utama, keanggotaan_id IS NULL) milik satu mahasiswa.
 * Pagination 15/halaman, urut terbaru dulu (created_at DESC, id DESC).
 */
const PER_PAGE = 15;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "ID mahasiswa wajib disertakan" }, { status: 400 });

  // Isolasi: hanya mahasiswa dalam cakupan user, dan hanya yang memang mahasiswa/admin_kelas
  const student = db
    .prepare(
      `SELECT u.id, u.nim, COALESCE(u.nomor_id, u.nim) as nomor_id, u.nama, u.kelas_id,
              (SELECT nama FROM kelas WHERE id = u.kelas_id LIMIT 1) as nama_kelas
       FROM users u WHERE u.id = ? AND u.role IN ('mahasiswa','admin_kelas')`
    )
    .get(id) as any;

  if (!student) return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  if (!canAccessMahasiswa(user, id)) {
    return NextResponse.json({ error: "Anda tidak berhak melihat mutasi di luar Program Studi Anda" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const tipe = searchParams.get("tipe"); // "masuk" | "keluar" | null
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  // ponytail: tanda jumlah = arah uang. Semua insert pakai +masuk / -keluar (lihat ledger.ts, transaksi/manual).
  let arah = "";
  if (tipe === "masuk") arah = " AND jumlah > 0";
  else if (tipe === "keluar") arah = " AND jumlah < 0";

  const SCOPED = `FROM transaksi WHERE user_id = ? AND keanggotaan_id IS NULL AND status = 'berhasil'${arah}`;

  const total = Number((db.prepare(`SELECT COUNT(*) as n ${SCOPED}`).get(id) as any)?.n || 0);

  // Ringkasan selalu dihitung dari SEMUA transaksi saku (tidak ikut filter tab)
  const sum = db
    .prepare(
      `SELECT
         COALESCE(SUM(CASE WHEN jumlah > 0 THEN jumlah END), 0) as masuk,
         COALESCE(SUM(CASE WHEN jumlah < 0 THEN -jumlah END), 0) as keluar
       FROM transaksi WHERE user_id = ? AND keanggotaan_id IS NULL AND status = 'berhasil'`
    )
    .get(id) as any;

  const totalMasuk = Number(sum?.masuk || 0);
  const totalKeluar = Number(sum?.keluar || 0);

  const rows = db
    .prepare(
      `SELECT id, tipe, jumlah, catatan, dibuat_oleh, created_at, paid_at
       ${SCOPED}
       ORDER BY datetime(COALESCE(paid_at, created_at)) DESC, created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(id, PER_PAGE, (page - 1) * PER_PAGE) as any[];

  // Saldo setelah transaksi: saldo berjalan dihitung dari yang TERLAMA, bukan dari halaman ini.
  // Satu query ringkas untuk semua baris yang lebih tua/lebih baru → cukup untuk halaman berjalan.
  const ids = rows.map((r) => r.id);
  const saldoSetelah: Record<string, number> = {};
  if (ids.length > 0) {
    // Ambil seluruh transaksi berhasil milik user, urut lama→baru, akumulasi.
    // ponytail: O(n) per halaman; kalau riwayat per-user tembus puluhan ribu, ganti ke kolom saldo_running materialized.
    const all = db
      .prepare(
        `SELECT id, jumlah FROM transaksi
         WHERE user_id = ? AND keanggotaan_id IS NULL AND status = 'berhasil'
         ORDER BY datetime(COALESCE(paid_at, created_at)) ASC, created_at ASC`
      )
      .all(id) as any[];
    let running = 0;
    for (const t of all) {
      running += Number(t.jumlah || 0);
      saldoSetelah[t.id] = running;
    }
  }

  return NextResponse.json({
    mahasiswa: {
      id: student.id,
      nama: student.nama,
      nomor_id: student.nomor_id,
      kelas: student.nama_kelas || null,
    },
    saldo_sekarang: totalMasuk - totalKeluar,
    ringkasan: { masuk: totalMasuk, keluar: totalKeluar },
    page,
    per_page: PER_PAGE,
    total,
    has_more: page * PER_PAGE < total,
    data: rows.map((r) => ({
      id: r.id,
      tipe: r.tipe,
      arah: Number(r.jumlah) > 0 ? "masuk" : "keluar",
      jumlah: Math.abs(Number(r.jumlah)),
      catatan: r.catatan || null,
      dibuat_oleh: r.dibuat_oleh || null,
      tanggal: r.paid_at || r.created_at,
      saldo_setelah: saldoSetelah[r.id] ?? null,
    })),
  });
}
