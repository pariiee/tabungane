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
      k.nama as nama_kelas,
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
    JOIN kelas k ON g.kelas_id = k.id
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

  return NextResponse.json({
    user,
    saldo_dompet: saldoDompet,
    total_tabungan: totalTabungan,
    groups: formattedGroups,
  });
}
