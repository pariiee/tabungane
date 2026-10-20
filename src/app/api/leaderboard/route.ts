import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "saldo"; // "saldo" | "topup"

  const isAdmin = user.role === "admin";

  let query = "";

  if (tab === "topup") {
    // Top 10 Setoran (Akumulasi uang masuk berhasil)
    query = `
      SELECT 
        u.id as user_id,
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
        ), 0) as total_value
      FROM users u
      LEFT JOIN kelas k ON u.kelas_id = k.id
      WHERE u.role = 'mahasiswa' AND u.aktif = 1
      ORDER BY total_value DESC, u.nama ASC
      LIMIT 10
    `;
  } else {
    // Default: Top 10 Saldo (Dompet saku + seluruh tabungan event)
    query = `
      SELECT 
        u.id as user_id,
        u.nim,
        u.nama,
        u.foto_url,
        COALESCE(k.nama, 'Tanpa Kelas') as nama_kelas,
        COALESCE(u.tampilkan_saldo_leaderboard, 0) as tampilkan_saldo,
        COALESCE((
          SELECT SUM(t.jumlah)
          FROM transaksi t
          LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
          WHERE (t.user_id = u.id OR kg.user_id = u.id) AND t.status = 'berhasil'
        ), 0) as total_value
      FROM users u
      LEFT JOIN kelas k ON u.kelas_id = k.id
      WHERE u.role = 'mahasiswa' AND u.aktif = 1
      ORDER BY total_value DESC, u.nama ASC
      LIMIT 10
    `;
  }

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
    // Privasi: nominal hanya terlihat jika user mengizinkan (tampilkan_saldo == 1)
    const canSeeAmount = isPublic;

    return {
      rank: currentRank,
      user_id: m.user_id,
      nama: m.nama,
      foto_url: m.foto_url || null,
      nim: isMe || isAdmin ? m.nim : `${m.nim.slice(0, 3)}***`,
      nama_kelas: m.nama_kelas,
      is_me: isMe,
      tampilkan_saldo: isPublic,
      total_value: canSeeAmount ? m.total_value : null,
      display_value: canSeeAmount ? `Rp ${m.total_value.toLocaleString("id-ID")}` : null,
      progress_pct: Math.min(Math.round((m.total_value / maxVal) * 100), 100),
    };
  });

  const totalStudents = db
    .prepare("SELECT COUNT(id) as total FROM users WHERE role = 'mahasiswa' AND aktif = 1")
    .get() as any;
  const myRankIndex = leaderboard.findIndex((m) => m.is_me);

  return NextResponse.json({
    tab,
    leaderboard,
    my_standing: {
      rank: myRankIndex !== -1 ? leaderboard[myRankIndex].rank : "-",
      total_students: totalStudents?.total || 0,
      is_top10: myRankIndex !== -1,
    },
  });
}
