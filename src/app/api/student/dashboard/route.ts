import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all groups user is enrolled in
  const groups = db.prepare(`
    SELECT 
      g.id as grup_id,
      g.nama as nama_grup,
      g.target_per_mahasiswa,
      g.deadline,
      g.status,
      COALESCE(k.nama, 'Semua Kelas') as nama_kelas,
      COALESCE((
        SELECT SUM(t.jumlah) 
        FROM transaksi t 
        JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id 
        WHERE kg2.grup_id = g.id AND kg2.user_id = ? AND t.status = 'berhasil'
      ), 0) as saldo_saya,
      COALESCE((
        SELECT SUM(t.jumlah) 
        FROM transaksi t 
        JOIN keanggotaan kg3 ON t.keanggotaan_id = kg3.id 
        WHERE kg3.grup_id = g.id AND t.status = 'berhasil'
      ), 0) as total_terkumpul_grup
    FROM keanggotaan kg
    JOIN grup_tabungan g ON kg.grup_id = g.id
    LEFT JOIN kelas k ON g.kelas_id = k.id
    WHERE kg.user_id = ?
    ORDER BY g.created_at DESC
  `).all(user.id, user.id) as any[];

  // Calculate days remaining
  const formattedGroups = groups.map((g) => {
    const deadlineDate = new Date(g.deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const progressPct = g.target_per_mahasiswa > 0 
      ? Math.round((g.saldo_saya / g.target_per_mahasiswa) * 100) 
      : 0;

    return {
      ...g,
      sisa_hari: diffDays > 0 ? diffDays : 0,
      is_lewat_deadline: diffDays <= 0,
      progress_pct: progressPct,
    };
  });

  const totalTabungan = formattedGroups.reduce((acc, cur) => acc + cur.saldo_saya, 0);
  const saldoDompet = getWalletBalance(user.id);

  // 2. Chart 14 days for this student
  const chartDays = [];
  let total14DaysMasuk = 0;
  let total14DaysKeluar = 0;

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];

    const masukRow = db
      .prepare(`
        SELECT COALESCE(SUM(t.jumlah), 0) as total
        FROM transaksi t
        LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
        WHERE (t.user_id = ? OR kg.user_id = ?)
          AND t.status = 'berhasil'
          AND t.jumlah > 0
          AND date(t.created_at) = date(?)
      `)
      .get(user.id, user.id, dateStr) as any;

    const keluarRow = db
      .prepare(`
        SELECT COALESCE(SUM(ABS(t.jumlah)), 0) as total
        FROM transaksi t
        LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
        WHERE (t.user_id = ? OR kg.user_id = ?)
          AND t.status = 'berhasil'
          AND t.jumlah < 0
          AND date(t.created_at) = date(?)
      `)
      .get(user.id, user.id, dateStr) as any;

    const valMasuk = Number(masukRow.total || 0);
    const valKeluar = Number(keluarRow.total || 0);
    total14DaysMasuk += valMasuk;
    total14DaysKeluar += valKeluar;

    const [yyyy, mm, dd] = dateStr.split("-");
    chartDays.push({
      date: dateStr,
      shortDate: `${mm}/${dd}`,
      total_masuk: valMasuk,
      total_keluar: valKeluar,
    });
  }

  // 3. Recent 5 transactions
  const recent = db
    .prepare(`
      SELECT t.id, t.tipe, t.jumlah, t.status, t.catatan, t.created_at, COALESCE(g.nama, 'Dompet Utama') as nama_grup
      FROM transaksi t
      LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
      LEFT JOIN grup_tabungan g ON kg.grup_id = g.id
      WHERE t.user_id = ? OR kg.user_id = ?
      ORDER BY t.created_at DESC
      LIMIT 5
    `)
    .all(user.id, user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      nomor_id: user.nomor_id,
      nama: user.nama,
      username: user.username,
      role: user.role,
      nama_kelas: user.nama_kelas,
      nama_prodi: user.nama_prodi,
      nama_fakultas: user.nama_fakultas,
      foto_url: user.foto_url,
    },
    kpi: {
      saldo_dompet: saldoDompet,
      total_tabungan: totalTabungan,
      total_events: formattedGroups.length,
      total14DaysMasuk,
      total14DaysKeluar,
    },
    chart: chartDays,
    recent,
    groups: formattedGroups,
  });
}
