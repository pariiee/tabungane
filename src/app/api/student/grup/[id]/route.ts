import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: grupId } = await params;

  const grup = db.prepare(`
    SELECT g.*, k.nama as nama_kelas, k.tahun_ajaran
    FROM grup_tabungan g
    JOIN kelas k ON g.kelas_id = k.id
    WHERE g.id = ?
  `).get(grupId) as any;

  if (!grup) {
    return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });
  }

  // Group total collected
  const totalGroupRow = db.prepare(`
    SELECT COALESCE(SUM(t.jumlah), 0) as total
    FROM transaksi t
    JOIN keanggotaan kg ON t.keanggotaan_id = kg.id
    WHERE kg.grup_id = ? AND t.status = 'berhasil'
  `).get(grupId) as any;

  // Fetch all members with their progress
  const members = db.prepare(`
    SELECT 
      u.id as user_id,
      u.nim,
      u.nama,
      COALESCE(u.tampilkan_saldo_leaderboard, 0) as tampilkan_saldo,
      COALESCE((
        SELECT SUM(t.jumlah)
        FROM transaksi t
        JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id
        WHERE kg2.grup_id = ? AND kg2.user_id = u.id AND t.status = 'berhasil'
      ), 0) as saldo
    FROM keanggotaan kg
    JOIN users u ON kg.user_id = u.id
    WHERE kg.grup_id = ?
  `).all(grupId, grupId) as any[];

  // PRD M7 rule: Leaderboard ranking persen progres.
  // Nominal HANYA terlihat oleh diri sendiri dan admin! Nominal orang lain TIDAK dikirim.
  const isAdmin = user.role === "admin";
  const target = grup.target_per_mahasiswa || 1;

  const leaderboard = members
  .map((m) => {
    const isMe = m.user_id === user.id;
    const pct = Math.round((m.saldo / target) * 100);
    return {
      user_id: isMe || isAdmin ? m.user_id : undefined,
      nama: m.nama,
      nim: isMe || isAdmin ? (m.nomor_id || m.nim) : `${String(m.nomor_id || m.nim).slice(0, 3)}***`,
      is_me: isMe,
      progress_pct: pct,
      tampilkan_saldo: Boolean(m.tampilkan_saldo),
      // Saldo dikirim jika diri sendiri, admin, ATAU jika mahasiswa mengizinkan tampil publik
      saldo: isMe || isAdmin || Boolean(m.tampilkan_saldo) ? m.saldo : null,
    };
  })
    .sort((a, b) => {
      if (b.progress_pct !== a.progress_pct) {
        return b.progress_pct - a.progress_pct; // Urut persen tertinggi
      }
      return a.nama.localeCompare(b.nama); // Jika seri, urut nama
    })
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

  // Sisa waktu
  const deadlineDate = new Date(grup.deadline);
  const now = new Date();
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return NextResponse.json({
    grup: {
      id: grup.id,
      nama: grup.nama,
      target_per_mahasiswa: grup.target_per_mahasiswa,
      deadline: grup.deadline,
      status: grup.status,
      nama_kelas: grup.nama_kelas,
      total_terkumpul: totalGroupRow.total || 0,
      sisa_hari: diffDays > 0 ? diffDays : 0,
    },
    leaderboard,
  });
}
