import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createQrisPayment } from "@/lib/qriskuu";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { grup_id, amount } = await req.json();

    // PRD rule: min 1000, max 1000000
    const nominal = parseInt(amount, 10);
    if (isNaN(nominal) || nominal < 1000 || nominal > 1000000) {
      return NextResponse.json({ error: "Nominal harus antara Rp1.000 dan Rp1.000.000" }, { status: 400 });
    }

    if (!grup_id) {
      return NextResponse.json({ error: "Grup tabungan wajib dipilih" }, { status: 400 });
    }

    // Verify membership
    let membership = db
      .prepare("SELECT id FROM keanggotaan WHERE grup_id = ? AND user_id = ?")
      .get(grup_id, user.id) as any;

    if (!membership) {
      // Auto-join membership if student belongs to the group's class
      const grup = db.prepare("SELECT kelas_id FROM grup_tabungan WHERE id = ?").get(grup_id) as any;
      if (!grup) {
        return NextResponse.json({ error: "Grup tabungan tidak ditemukan" }, { status: 404 });
      }
      const newMemberId = crypto.randomUUID();
      db.prepare("INSERT INTO keanggotaan (id, grup_id, user_id) VALUES (?, ?, ?)").run(
        newMemberId,
        grup_id,
        user.id
      );
      membership = { id: newMemberId };
    }

    // PRD rule: cancel previous pending QR for this user
    db.prepare(`
      UPDATE transaksi 
      SET status = 'canceled' 
      WHERE keanggotaan_id = ? AND status = 'pending' AND tipe = 'topup_qris'
    `).run(membership.id);

    // Call QRIS generator
    const qrisRes = await createQrisPayment(nominal, `Top up Tabungan ${user.nim}`);

    const trxId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transaksi (
        id, keanggotaan_id, tipe, jumlah, status, qris_trx_id, catatan, dibuat_oleh, expired_at
      ) VALUES (?, ?, 'topup_qris', ?, 'pending', ?, 'Top up QRIS', ?, ?)
    `).run(trxId, membership.id, nominal, qrisRes.trxid, user.nama, qrisRes.expired_at);

    return NextResponse.json({
      success: true,
      trxid: qrisRes.trxid,
      qr_url: qrisRes.qr_url,
      expired_at: qrisRes.expired_at,
      amount: nominal,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat QRIS" }, { status: 500 });
  }
}
