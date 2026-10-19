import { NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "node:crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transaksi_id, alasan } = await req.json();

  if (!transaksi_id || !alasan) {
    return NextResponse.json({ error: "ID transaksi dan alasan koreksi wajib diisi" }, { status: 400 });
  }

  const origTrx = db.prepare("SELECT * FROM transaksi WHERE id = ?").get(transaksi_id) as any;
  if (!origTrx) {
    return NextResponse.json({ error: "Transaksi asal tidak ditemukan" }, { status: 404 });
  }

  if (origTrx.status !== "berhasil") {
    return NextResponse.json({ error: "Hanya transaksi berstatus berhasil yang dapat dikoreksi" }, { status: 400 });
  }

  if (origTrx.tipe === "reversal") {
    return NextResponse.json({ error: "Transaksi koreksi tidak dapat dikoreksi ulang" }, { status: 400 });
  }

  // Cek apakah transaksi sudah pernah dikoreksi sebelumnya
  const alreadyReversed = db.prepare(
    "SELECT id FROM transaksi WHERE ref_transaksi_id = ? AND tipe = 'reversal'"
  ).get(origTrx.id);
  if (alreadyReversed) {
    return NextResponse.json({ error: "Transaksi ini sudah pernah dikoreksi sebelumnya" }, { status: 400 });
  }

  // Cek saldo keanggotaan: tolak jika membuat saldo menjadi negatif
  const balanceRow = db.prepare(
    "SELECT COALESCE(SUM(jumlah), 0) AS total FROM transaksi WHERE keanggotaan_id = ? AND status = 'berhasil'"
  ).get(origTrx.keanggotaan_id) as any;
  const currentBalance = balanceRow ? Number(balanceRow.total) : 0;
  const amountToDeduct = Math.abs(origTrx.jumlah);

  if (currentBalance - amountToDeduct < 0) {
    return NextResponse.json({
      error: `Koreksi ditolak: Saldo mahasiswa saat ini (Rp ${currentBalance.toLocaleString("id-ID")}) tidak mencukupi karena akan membuat saldo menjadi negatif.`
    }, { status: 400 });
  }

  // PRD M10 / 6.3: Transaksi pembalik bernilai negatif yang menaut ke transaksi asal. Transaksi asal tidak diubah.
  const reversalId = crypto.randomUUID();
  const negativeAmount = -amountToDeduct;

  const { runTransaction } = require("@/lib/db");
  runTransaction(() => {
    db.prepare(`
      INSERT INTO transaksi (
        id, keanggotaan_id, tipe, jumlah, status, ref_transaksi_id, catatan, dibuat_oleh, paid_at
      ) VALUES (?, ?, 'reversal', ?, 'berhasil', ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      reversalId,
      origTrx.keanggotaan_id,
      negativeAmount,
      origTrx.id,
      `Koreksi: ${alasan}`,
      user.nama
    );
  });

  logAudit(user.id, "KOREKSI_SALDO", reversalId, `Pembalik untuk trx ${origTrx.id}. Alasan: ${alasan}`);

  return NextResponse.json({ success: true, id: reversalId });
}
