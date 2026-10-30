import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProdiScope } from "@/lib/scope";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const prodiScope = getProdiScope(user);
  const todayWib = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());

  // 1. TODAY'S REVENUE (Zona Waktu WIB Asia/Jakarta)
  let todayRow: any;
  let totalRow: any;
  let pendingRow: any;
  let allTrxRow: any;
  let expiredRow: any;
  let canceledRow: any;
  let studentRow: any;
  let kelasRow: any;

  if (prodiScope) {
    todayRow = db
      .prepare(
        `SELECT COALESCE(SUM(t.jumlah), 0) as total, COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE t.status = 'berhasil' AND date(datetime(t.created_at, '+7 hours')) = date(?) AND (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(todayWib, prodiScope, prodiScope) as any;

    totalRow = db
      .prepare(
        `SELECT COALESCE(SUM(t.jumlah), 0) as total, COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE t.status = 'berhasil' AND (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(prodiScope, prodiScope) as any;

    pendingRow = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE t.status = 'pending' AND (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(prodiScope, prodiScope) as any;

    allTrxRow = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(prodiScope, prodiScope) as any;

    expiredRow = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE t.status = 'expired' AND (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(prodiScope, prodiScope) as any;

    canceledRow = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM transaksi t
         LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
         JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
         LEFT JOIN kelas k ON u.kelas_id = k.id
         WHERE t.status = 'canceled' AND (k.prodi_id = ? OR u.prodi_id = ?)`
      )
      .get(prodiScope, prodiScope) as any;

    studentRow = db
      .prepare(
        `SELECT COUNT(*) as count 
         FROM users u 
         JOIN kelas k ON u.kelas_id = k.id 
         WHERE u.role IN ('mahasiswa', 'admin_kelas') AND u.aktif = 1 AND k.prodi_id = ?`
      )
      .get(prodiScope) as any;

    kelasRow = db.prepare("SELECT COUNT(*) as count FROM kelas WHERE prodi_id = ?").get(prodiScope) as any;
  } else {
    todayRow = db
      .prepare(
        `SELECT 
           COALESCE(SUM(jumlah), 0) as total,
           COUNT(*) as count 
         FROM transaksi 
         WHERE status = 'berhasil' AND date(datetime(created_at, '+7 hours')) = date(?)`
      )
      .get(todayWib) as any;

    totalRow = db
      .prepare(
        `SELECT 
           COALESCE(SUM(jumlah), 0) as total,
           COUNT(*) as count 
         FROM transaksi 
         WHERE status = 'berhasil'`
      )
      .get() as any;

    pendingRow = db
      .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'pending'")
      .get() as any;

    allTrxRow = db
      .prepare("SELECT COUNT(*) as count FROM transaksi")
      .get() as any;

    expiredRow = db
      .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'expired'")
      .get() as any;
    canceledRow = db
      .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'canceled'")
      .get() as any;

    studentRow = db
      .prepare("SELECT COUNT(*) as count FROM users WHERE role IN ('mahasiswa', 'admin_kelas') AND aktif = 1")
      .get() as any;
    kelasRow = db
      .prepare("SELECT COUNT(*) as count FROM kelas")
      .get() as any;
  }

  // 5. CHART 14 DAYS
  const chartDays = [];
  let total14Days = 0;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    let paidAmt = 0;
    let totalAmt = 0;

    if (prodiScope) {
      const berhasilRow = db
        .prepare(
          `SELECT COALESCE(SUM(t.jumlah), 0) as total 
           FROM transaksi t
           JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
           JOIN users u ON kg.user_id = u.id
           JOIN kelas k ON u.kelas_id = k.id
           WHERE t.status = 'berhasil' AND date(t.created_at) = date(?) AND k.prodi_id = ?`
        )
        .get(dateStr, prodiScope) as any;

      paidAmt = berhasilRow?.total || 0;
      totalAmt = paidAmt;
    } else {
      const berhasilRow = db
        .prepare(
          "SELECT COALESCE(SUM(jumlah), 0) as total FROM transaksi WHERE status = 'berhasil' AND date(created_at) = date(?)"
        )
        .get(dateStr) as any;

      paidAmt = berhasilRow?.total || 0;
      totalAmt = paidAmt;
    }

    total14Days += paidAmt;

    // Short date: MM/DD
    const parts = dateStr.split("-");
    const shortDate = `${parts[1]}/${parts[2]}`;

    chartDays.push({
      shortDate,
      fullDate: dateStr,
      total_amount: totalAmt,
      paid_amount: paidAmt,
    });
  }

  // 6. RECENT TRANSACTIONS (Latest 7)
  let recent: any[] = [];
  if (prodiScope) {
    recent = db
      .prepare(`
        SELECT t.id, t.qris_trx_id, t.jumlah, t.status, t.created_at, t.tipe,
               u.nim, u.nama as nama_mahasiswa, COALESCE(g.nama, 'Dompet Utama (Saku)') as nama_grup
        FROM transaksi t
        LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
        LEFT JOIN grup_tabungan g ON kg.grup_id = g.id
        LEFT JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
        LEFT JOIN kelas k ON u.kelas_id = k.id
        WHERE (k.prodi_id = ? OR u.prodi_id = ?)
        ORDER BY t.created_at DESC
        LIMIT 7
      `)
      .all(prodiScope, prodiScope) as any[];
  } else {
    recent = db
      .prepare(`
        SELECT t.id, t.qris_trx_id, t.jumlah, t.status, t.created_at, t.tipe,
               u.nim, u.nama as nama_mahasiswa, COALESCE(g.nama, 'Dompet Utama (Saku)') as nama_grup
        FROM transaksi t
        LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
        LEFT JOIN grup_tabungan g ON kg.grup_id = g.id
        LEFT JOIN users u ON (t.user_id = u.id OR kg.user_id = u.id)
        ORDER BY t.created_at DESC
        LIMIT 7
      `)
      .all() as any[];
  }

  // Format ID to clean lowercase short string if UUID
  const formattedRecent = recent.map((r) => {
    let cleanId = r.qris_trx_id || r.id;
    if (cleanId.length > 8) {
      cleanId = cleanId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toLowerCase();
    }
    return {
      ...r,
      display_id: cleanId,
    };
  });

  return NextResponse.json({
    kpi: {
      today_revenue: todayRow.total || 0,
      today_paid_count: todayRow.count || 0,
      total_revenue: totalRow.total || 0,
      total_paid_count: totalRow.count || 0,
      pending_count: pendingRow.count || 0,
      total_trx_count: allTrxRow.count || 0,
      expired_count: expiredRow.count || 0,
      canceled_count: canceledRow.count || 0,
      failed_count: (expiredRow.count || 0) + (canceledRow.count || 0),
      total_mahasiswa: studentRow.count || 0,
      total_kelas: kelasRow.count || 0,
      total_14_days: total14Days,
    },
    chart: chartDays,
    recent: formattedRecent,
  });
}
