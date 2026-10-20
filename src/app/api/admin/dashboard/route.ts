import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. TODAY'S REVENUE (Zona Waktu WIB Asia/Jakarta)
  const todayWib = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
  const todayRow = db
    .prepare(
      `SELECT 
         COALESCE(SUM(jumlah), 0) as total,
         COUNT(*) as count 
       FROM transaksi 
       WHERE status = 'berhasil' AND date(datetime(created_at, '+7 hours')) = date(?)`
    )
    .get(todayWib) as any;

  // 2. TOTAL REVENUE
  const totalRow = db
    .prepare(
      `SELECT 
         COALESCE(SUM(jumlah), 0) as total,
         COUNT(*) as count 
       FROM transaksi 
       WHERE status = 'berhasil'`
    )
    .get() as any;

  // 3. PENDING
  const pendingRow = db
    .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'pending'")
    .get() as any;

  // Total All Transactions count
  const allTrxRow = db
    .prepare("SELECT COUNT(*) as count FROM transaksi")
    .get() as any;

  // 4. FAILED / CANCELED
  const expiredRow = db
    .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'expired'")
    .get() as any;
  const canceledRow = db
    .prepare("SELECT COUNT(*) as count FROM transaksi WHERE status = 'canceled'")
    .get() as any;

  // Total Mahasiswa & Kelas
  const studentRow = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'mahasiswa' AND aktif = 1")
    .get() as any;
  const kelasRow = db
    .prepare("SELECT COUNT(*) as count FROM kelas")
    .get() as any;

  // 5. CHART 14 DAYS
  const chartDays = [];
  let total14Days = 0;
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const berhasilRow = db
      .prepare(
        "SELECT COALESCE(SUM(jumlah), 0) as total FROM transaksi WHERE status = 'berhasil' AND date(created_at) = date(?)"
      )
      .get(dateStr) as any;

    const allAttemptedRow = db
      .prepare(
        "SELECT COALESCE(SUM(ABS(jumlah)), 0) as total FROM transaksi WHERE status IN ('berhasil', 'pending') AND date(created_at) = date(?)"
      )
      .get(dateStr) as any;

    const paidAmt = berhasilRow.total || 0;
    const totalAmt = Math.max(allAttemptedRow.total || 0, paidAmt);
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
  const recent = db
    .prepare(`
      SELECT t.id, t.qris_trx_id, t.jumlah, t.status, t.created_at, t.tipe,
             u.nim, u.nama as nama_mahasiswa, g.nama as nama_grup
      FROM transaksi t
      JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
      JOIN users u ON kg.user_id = u.id
      JOIN grup_tabungan g ON kg.grup_id = g.id
      ORDER BY t.created_at DESC
      LIMIT 7
    `)
    .all() as any[];

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
