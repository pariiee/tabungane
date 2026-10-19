import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "saldo"; // "saldo" | "topup" | "rajin"

  const isAdmin = user.role === "admin";

  let query = "";
  if (tab === "topup") {
    // Top 10 Top Up Terbanyak (QRIS & Setoran Tunai)
    query = `
      SELECT 
        u.id as user_id,
        u.nim,
        u.nama,
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
  } else if (tab === "rajin") {
    // Top 10 Paling Rajin Menabung (Frekuensi transaksi)
    query = `
      SELECT 
        u.id as user_id,
        u.nim,
        u.nama,
        COALESCE(k.nama, 'Tanpa Kelas') as nama_kelas,
        COALESCE(u.tampilkan_saldo_leaderboard, 0) as tampilkan_saldo,
        COALESCE((
          SELECT COUNT(t.id)
          FROM transaksi t
          LEFT JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
          WHERE (t.user_id = u.id OR kg.user_id = u.id) 
            AND t.status = 'berhasil' 
            AND t.jumlah > 0
        ), 0) as total_value,
        COALESCE((
          SELECT SUM(t.jumlah)
          FROM transaksi t
          LEFT JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id
          WHERE (t.user_id = u.id OR kg2.user_id = u.id) AND t.status = 'berhasil'
        ), 0) as saldo_nominal
      FROM users u
      LEFT JOIN kelas k ON u.kelas_id = k.id
      WHERE u.role = 'mahasiswa' AND u.aktif = 1
      ORDER BY total_value DESC, u.nama ASC
      LIMIT 10
    `;
  } else {
    // Default: Top 10 Akumulasi Saldo Terbanyak (Dompet Saku + Seluruh Event Tabungan)
    query = `
      SELECT 
        u.id as user_id,
        u.nim,
        u.nama,
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

  const leaderboard = rows.map((m, idx) => {
    const isMe = m.user_id === user.id;
    const isPublic = Boolean(m.tampilkan_saldo);
    const canSeeAmount = isMe || isAdmin || isPublic;

    return {
      rank: idx + 1,
      user_id: m.user_id,
      nama: m.nama,
      nim: isMe || isAdmin ? m.nim : `${m.nim.slice(0, 3)}***`,
      nama_kelas: m.nama_kelas,
      is_me: isMe,
      tampilkan_saldo: isPublic,
      total_value: m.total_value,
      display_value: tab === "rajin" ? `${m.total_value}x Setoran` : canSeeAmount ? `Rp ${m.total_value.toLocaleString("id-ID")}` : null,
      saldo_nominal: canSeeAmount ? (tab === "rajin" ? m.saldo_nominal : m.total_value) : null,
      progress_pct: Math.min(Math.round((m.total_value / maxVal) * 100), 100),
    };
  });

  return NextResponse.json({
    tab,
    leaderboard,
  });
}
