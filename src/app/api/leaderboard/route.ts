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
  const grupId = searchParams.get("grup_id") || "";

  const isAdmin = user.role === "admin";

  // Fetch all active groups for the switcher dropdown
  const allGroups = db
    .prepare(
      `SELECT id, nama, deadline, target_per_mahasiswa, status
       FROM grup_tabungan
       WHERE status = 'aktif'
       ORDER BY created_at DESC`
    )
    .all() as any[];

  // Group metadata if selected
  let grupInfo: any = null;
  if (grupId) {
    grupInfo = db
      .prepare(
        `SELECT 
          g.id, g.nama, g.target_per_mahasiswa, g.deadline, g.status,
          COALESCE((
            SELECT SUM(t.jumlah)
            FROM transaksi t
            JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
            WHERE kg.grup_id = g.id AND t.status = 'berhasil'
          ), 0) as total_terkumpul
        FROM grup_tabungan g
        WHERE g.id = ?`
      )
      .get(grupId);
  }

  let query = "";
  let params: any[] = [];

  if (tab === "topup") {
    // Top Setoran (Akumulasi uang masuk berhasil)
    if (grupId) {
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
        FROM keanggotaan kg
        JOIN users u ON kg.user_id = u.id
        LEFT JOIN kelas k ON u.kelas_id = k.id
        WHERE kg.grup_id = ? AND u.role = 'mahasiswa' AND u.aktif = 1
        ORDER BY total_value DESC, u.nama ASC
        LIMIT 25
      `;
      params = [grupId];
    } else {
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
        LIMIT 25
      `;
    }
  } else {
    // Default: Top Saldo (Akumulasi saldo saku + seluruh tabungan event)
    if (grupId) {
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
            LEFT JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id
            WHERE (t.user_id = u.id OR kg2.user_id = u.id) AND t.status = 'berhasil'
          ), 0) as total_value
        FROM keanggotaan kg
        JOIN users u ON kg.user_id = u.id
        LEFT JOIN kelas k ON u.kelas_id = k.id
        WHERE kg.grup_id = ? AND u.role = 'mahasiswa' AND u.aktif = 1
        ORDER BY total_value DESC, u.nama ASC
        LIMIT 25
      `;
      params = [grupId];
    } else {
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
        LIMIT 25
      `;
    }
  }

  const rows = (params.length ? db.prepare(query).all(...params) : db.prepare(query).all()) as any[];

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
    // User login SELALU bisa melihat nominal miliknya sendiri; orang lain disembunyikan jika tidak publik
    const canSeeAmount = isMe || isAdmin || isPublic;

    return {
      rank: currentRank,
      user_id: m.user_id,
      nama: m.nama,
      foto_url: m.foto_url || null,
      nim: isMe || isAdmin ? m.nim : `${m.nim.slice(0, 3)}***`,
      nama_kelas: m.nama_kelas,
      is_me: isMe,
      tampilkan_saldo: isPublic,
      // Strict network payload privacy: jangan kirim nominal jika orang lain menyembunyikannya
      total_value: canSeeAmount ? m.total_value : null,
      display_value: canSeeAmount ? `Rp ${m.total_value.toLocaleString("id-ID")}` : null,
      saldo_nominal: canSeeAmount ? m.total_value : null,
      progress_pct: Math.min(Math.round((m.total_value / maxVal) * 100), 100),
    };
  });

  const totalStudents = db.prepare("SELECT COUNT(id) as total FROM users WHERE role = 'mahasiswa' AND aktif = 1").get() as any;
  const myRankIndex = leaderboard.findIndex((m) => m.is_me);

  return NextResponse.json({
    tab,
    grup_id: grupId,
    grup_info: grupInfo,
    all_groups: allGroups,
    leaderboard,
    my_standing: {
      rank: myRankIndex !== -1 ? leaderboard[myRankIndex].rank : "-",
      total_students: totalStudents?.total || 0,
      is_top10: myRankIndex !== -1,
    },
  });
}
