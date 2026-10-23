import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  // period: "today" | "month" | "year"
  const period = searchParams.get("period") || searchParams.get("tab") || "month";

  const isAdmin = user.role === "admin" || user.role === "super_admin";

  let dateFilter = "";
  if (period === "today") {
    dateFilter = "AND DATE(COALESCE(t.paid_at, t.created_at), 'localtime') = DATE('now', 'localtime')";
  } else if (period === "year") {
    dateFilter = "AND STRFTIME('%Y', COALESCE(t.paid_at, t.created_at), 'localtime') = STRFTIME('%Y', 'now', 'localtime')";
  } else {
    // Default: month (Bulan ini)
    dateFilter = "AND STRFTIME('%Y-%m', COALESCE(t.paid_at, t.created_at), 'localtime') = STRFTIME('%Y-%m', 'now', 'localtime')";
  }

  // Top 10 Penabung: Hanya mahasiswa yang memiliki setoran > 0 dalam periode
  const query = `
    SELECT * FROM (
      SELECT 
        u.id as user_id,
        COALESCE(u.nomor_id, u.nim) as nomor_id,
        u.nim,
        u.nama,
        u.foto_url,
        COALESCE(k.nama, 'Tanpa Kelas') as nama_kelas,
        COALESCE(u.tampilkan_saldo_leaderboard, 0) as tampilkan_saldo,
        COALESCE((
          SELECT SUM(t.jumlah)
          FROM transaksi t
          WHERE t.user_id = u.id AND t.status = 'berhasil' 
            AND (t.tipe = 'topup_qris' OR t.tipe = 'manual_add' OR t.tipe = 'setoran_tunai')
            ${dateFilter}
        ), 0) as total_value
      FROM users u
      LEFT JOIN kelas k ON u.kelas_id = k.id
      WHERE u.role IN ('mahasiswa', 'admin_kelas') AND u.aktif = 1
    )
    WHERE total_value > 0
    ORDER BY total_value DESC, nama ASC
    LIMIT 10
  `;

  const rows = db.prepare(query).all() as any[];

  // Max value for progress bar calculation
  const maxVal = Math.max(...rows.map((r) => r.total_value || 0), 1);

  // Assign Olympic ranks with tie handling (identical values get same rank)
  let currentRank = 1;
  const leaderboard = rows.map((m, idx) => {
    if (idx > 0 && m.total_value < rows[idx - 1].total_value) {
      currentRank = idx + 1;
    }

    const isMe = m.user_id === user.id;
    const isPublic = Boolean(m.tampilkan_saldo);
    const canSeeAmount = isPublic || isMe || isAdmin;

    return {
      rank: currentRank,
      user_id: isMe || isAdmin ? m.user_id : undefined,
      nama: m.nama,
      foto_url: m.foto_url || null,
      nim: isMe || isAdmin ? (m.nomor_id || m.nim) : `${String(m.nomor_id || m.nim).slice(0, 3)}***`,
      nama_kelas: m.nama_kelas,
      is_me: isMe,
      tampilkan_saldo: isPublic,
      total_value: canSeeAmount ? m.total_value : null,
      display_value: canSeeAmount ? `Rp ${Number(m.total_value).toLocaleString("id-ID")}` : null,
      progress_pct: m.total_value > 0 ? Math.min(Math.round((m.total_value / maxVal) * 100), 100) : 0,
    };
  });

  const totalStudents = db
    .prepare("SELECT COUNT(id) as total FROM users WHERE role IN ('mahasiswa', 'admin_kelas') AND aktif = 1")
    .get() as any;
  const myRankIndex = leaderboard.findIndex((m) => m.is_me);

  return NextResponse.json({
    period,
    leaderboard,
    current_user_role: user.role,
    my_standing: {
      rank: myRankIndex !== -1 ? leaderboard[myRankIndex].rank : "-",
      total_students: totalStudents?.total || 0,
      is_top10: myRankIndex !== -1,
    },
    total_students: totalStudents?.total || 0,
  });
}
