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

  // PRD M10 / 6.3: Transaksi pembalik bernilai negatif yang menaut ke transaksi asal. Transaksi asal tidak diubah.
  const reversalId = crypto.randomUUID();
  const negativeAmount = -Math.abs(origTrx.jumlah);

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

  logAudit(user.id, "KOREKSI_SALDO", reversalId, `Pembalik untuk trx ${origTrx.id}. Alasan: ${alasan}`);

  return NextResponse.json({ success: true, id: reversalId });
}
