import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const requestedGrupId = searchParams.get("grup_id");

  // Get active groups
  const events = db.prepare(`
    SELECT g.id, g.nama, g.target_per_mahasiswa, g.deadline, COALESCE(k.nama, 'Semua Kelas') as nama_kelas
    FROM grup_tabungan g
    LEFT JOIN kelas k ON g.kelas_id = k.id
    WHERE g.status = 'aktif'
    ORDER BY g.created_at DESC
  `).all() as any[];

  const activeGrupId = requestedGrupId || (events.length > 0 ? events[0].id : null);

  if (!activeGrupId) {
    return NextResponse.json({
      events: [],
      current_event: null,
      leaderboard: [],
    });
  }

  const currentEvent = events.find((e) => e.id === activeGrupId) || events[0];

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
    WHERE kg.grup_id = ? AND u.aktif = 1
  `).all(currentEvent.id, currentEvent.id) as any[];

  const isAdmin = user.role === "admin";
  const target = currentEvent.target_per_mahasiswa || 1;

  const leaderboard = members
    .map((m) => {
      const isMe = m.user_id === user.id;
      const pct = Math.round((m.saldo / target) * 100);
      const isPublic = Boolean(m.tampilkan_saldo);

      return {
        user_id: m.user_id,
        nama: m.nama,
        nim: isMe || isAdmin ? m.nim : `${m.nim.slice(0, 3)}***`,
        is_me: isMe,
        progress_pct: pct,
        tampilkan_saldo: isPublic,
        // Saldo dikirim jika diri sendiri, admin, ATAU user mengizinkan tampil publik
        saldo: isMe || isAdmin || isPublic ? m.saldo : null,
      };
    })
    .sort((a, b) => {
      if (b.progress_pct !== a.progress_pct) {
        return b.progress_pct - a.progress_pct;
      }
      return a.nama.localeCompare(b.nama);
    })
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

  return NextResponse.json({
    events,
    current_event: currentEvent,
    leaderboard,
  });
}
