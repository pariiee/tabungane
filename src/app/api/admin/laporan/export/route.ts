import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const grup_id = searchParams.get("grup_id");

  if (!grup_id) {
    return NextResponse.json({ error: "Pilih grup untuk ekspor laporan" }, { status: 400 });
  }

  const grup = db.prepare("SELECT g.*, k.nama as nama_kelas FROM grup_tabungan g JOIN kelas k ON g.kelas_id = k.id WHERE g.id = ?").get(grup_id) as any;
  if (!grup) {
    return NextResponse.json({ error: "Grup tidak ditemukan" }, { status: 404 });
  }

  // Get student balances and details in this group
  const members = db.prepare(`
    SELECT u.nim, u.nama,
      COALESCE((
        SELECT SUM(t.jumlah)
        FROM transaksi t
        JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id
        WHERE kg2.grup_id = ? AND kg2.user_id = u.id AND t.status = 'berhasil'
      ), 0) as total_saldo,
      COALESCE((
        SELECT COUNT(t.id)
        FROM transaksi t
        JOIN keanggotaan kg3 ON t.keanggotaan_id = kg3.id
        WHERE kg3.grup_id = ? AND kg3.user_id = u.id AND t.status = 'berhasil'
      ), 0) as jumlah_transaksi
    FROM keanggotaan kg
    JOIN users u ON kg.user_id = u.id
    WHERE kg.grup_id = ?
    ORDER BY total_saldo DESC, u.nama ASC
  `).all(grup_id, grup_id, grup_id) as any[];

  // Build CSV string
  let csv = "NIM,Nama Mahasiswa,Total Tabungan (Rp),Target (Rp),Progres (%),Jumlah Setoran\n";
  for (const m of members) {
    const pct = grup.target_per_mahasiswa > 0 ? ((m.total_saldo / grup.target_per_mahasiswa) * 100).toFixed(1) : "0";
    csv += `"${m.nim}","${m.nama.replace(/"/g, '""')}",${m.total_saldo},${grup.target_per_mahasiswa},${pct}%,${m.jumlah_transaksi}\n`;
  }

  const filename = `laporan-tabungan-${grup.nama.replace(/[^a-zA-Z0-9]/g, "_")}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
