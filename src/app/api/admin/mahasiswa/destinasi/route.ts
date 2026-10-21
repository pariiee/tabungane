import { NextResponse } from "next/server";
import { getCurrentUser, isAdminUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWalletBalance } from "@/lib/ledger";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json({ error: "user_id wajib disertakan" }, { status: 400 });
  }

  const student = db.prepare("SELECT id, nama, COALESCE(nomor_id, nim) as nomor_id FROM users WHERE id = ?").get(userId) as any;
  if (!student) {
    return NextResponse.json({ error: "Mahasiswa tidak ditemukan" }, { status: 404 });
  }

  const dompetBalance = getWalletBalance(userId);

  const kantongList = db.prepare(`
    SELECT id, nama, saldo, warna, icon
    FROM kantong
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).all(userId) as any[];

  const eventList = db.prepare(`
    SELECT g.id, g.nama, g.target_per_mahasiswa,
      COALESCE((
        SELECT SUM(t.jumlah)
        FROM transaksi t
        JOIN keanggotaan kg2 ON t.keanggotaan_id = kg2.id
        WHERE kg2.grup_id = g.id AND kg2.user_id = ? AND t.status = 'berhasil'
      ), 0) as saldo_saya
    FROM keanggotaan kg
    JOIN grup_tabungan g ON kg.grup_id = g.id
    WHERE kg.user_id = ?
    ORDER BY g.created_at DESC
  `).all(userId, userId) as any[];

  return NextResponse.json({
    student,
    dompet: {
      id: "dompet_utama",
      nama: "Kantong Utama (Dompet Pribadi)",
      saldo: dompetBalance,
    },
    kantong: kantongList.map((k) => ({
      id: `kantong_${k.id}`,
      raw_id: k.id,
      nama: `Kantong: ${k.nama}`,
      saldo: k.saldo,
    })),
    events: eventList.map((e) => ({
      id: `grup_${e.id}`,
      raw_id: e.id,
      nama: `Event: ${e.nama}`,
      saldo: e.saldo_saya,
      target: e.target_per_mahasiswa,
    })),
  });
}
