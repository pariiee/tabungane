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

    // PRD rule: cancel previous pending QR for this user across all their memberships & wallet
    const pendingTrxs = db.prepare(`
      SELECT t.id, t.qris_trx_id 
      FROM transaksi t
      WHERE t.user_id = ? AND t.status = 'pending' AND t.tipe = 'topup_qris'
    `).all(user.id) as any[];

    for (const p of pendingTrxs) {
      if (p.qris_trx_id) {
        try {
          const apiKey = getSetting("qriskuu_api_key") || process.env.QRISKUU_API_KEY || "";
          if (apiKey) {
            const baseUrl = process.env.QRISKUU_BASE_URL || "https://qriskuu.com";
            await fetch(`${baseUrl}/payments/${encodeURIComponent(p.qris_trx_id)}/cancel`, {
              method: "POST",
              headers: {
                "X-API-Key": apiKey,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
              },
              signal: AbortSignal.timeout(3000),
            });
          }
        } catch {}
      }
      db.prepare("UPDATE transaksi SET status = 'canceled' WHERE id = ?").run(p.id);
    }

    // Call QRIS generator
    const topupLabel = isWallet ? `Top up Dompet Utama ${user.nomor_id}` : `Top up Event ${user.nomor_id}`;
    const qrisRes = await createQrisPayment(nominal, topupLabel);

    const trxId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO transaksi (
        id, user_id, keanggotaan_id, tipe, jumlah, status, qris_trx_id, catatan, dibuat_oleh, expired_at, qr_url
      ) VALUES (?, ?, ?, 'topup_qris', ?, 'pending', ?, ?, ?, ?, ?)
    `).run(
      trxId,
      user.id,
      membershipId ?? null,
      nominal,
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
      amount: nominal,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membuat QRIS" }, { status: 500 });
  }
}
