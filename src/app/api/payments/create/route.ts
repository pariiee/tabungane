import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, getSetting } from "@/lib/db";
import { createQrisPayment } from "@/lib/qriskuu";
import crypto from "node:crypto";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "admin" || user.role === "super_admin") {
      return NextResponse.json({ error: "Fitur top up hanya diperuntukkan bagi mahasiswa." }, { status: 403 });
    }

    const { grup_id, amount } = await req.json();

    // PRD rule: min 1000, max 1000000
    const nominal = parseInt(amount, 10);
    if (isNaN(nominal) || nominal < 1000 || nominal > 1000000) {
      return NextResponse.json({ error: "Nominal harus antara Rp1.000 dan Rp1.000.000" }, { status: 400 });
    }

    const isWallet = !grup_id || grup_id === "wallet";
    let membershipId: string | null = null;

    if (!isWallet) {
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
      membershipId = membership.id;
    }

    // Guard: Mahasiswa yang punya invoice pending tidak boleh buat invoice baru
    const existingPending = db.prepare(`
      SELECT t.id, t.qris_trx_id, t.jumlah, t.expired_at 
      FROM transaksi t
      WHERE t.user_id = ? AND t.status = 'pending' AND t.tipe = 'topup_qris'
      ORDER BY t.created_at DESC
      LIMIT 1
    `).get(user.id) as any;

    if (existingPending) {
      if (existingPending.expired_at && new Date(existingPending.expired_at) < new Date()) {
        db.prepare("UPDATE transaksi SET status = 'expired' WHERE id = ?").run(existingPending.id);
      } else {
        return NextResponse.json(
          {
            error: "Anda masih memiliki tagihan QRIS yang belum diselesaikan. Silakan bayar atau batalkan tagihan sebelumnya terlebih dahulu.",
            pending_trxid: existingPending.qris_trx_id || existingPending.id,
            pending_amount: existingPending.jumlah,
          },
          { status: 400 }
        );
      }
    }

    // Call QRIS generator
    const topupLabel = isWallet ? `Top up Dompet Utama ${user.nomor_id}` : `Top up Event ${user.nomor_id}`;
    const qrisRes = await createQrisPayment(nominal, topupLabel);

    const trxId = crypto.randomUUID();
    const finalAmount = qrisRes.amount || nominal;
    db.prepare(`
      INSERT INTO transaksi (
        id, user_id, keanggotaan_id, tipe, jumlah, status, qris_trx_id, channel, catatan, dibuat_oleh, expired_at, qr_url
      ) VALUES (?, ?, ?, 'topup_qris', ?, 'pending', ?, 'ShopeePay', ?, ?, ?, ?)
    `).run(
      trxId,
      user.id,
      membershipId ?? null,
      finalAmount,
      qrisRes.trxid ?? null,
      topupLabel,
      user.nama,
      qrisRes.expired_at ?? null,
      qrisRes.qr_url ?? null
    );

    return NextResponse.json({
      success: true,
      trxid: qrisRes.trxid,
      qr_url: qrisRes.qr_url,
      expired_at: qrisRes.expired_at,
      amount: finalAmount,
      base_amount: nominal,
      fee: qrisRes.fee || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat QRIS" }, { status: 500 });
  }
}
