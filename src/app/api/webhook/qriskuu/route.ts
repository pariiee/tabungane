import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/qriskuu";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    // In production, signature verification is required
    const isLocalDev = process.env.NODE_ENV !== "production";
    if (!isLocalDev && !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventId = payload.event_id || payload.id;
    const trxid = payload.trxid || payload.data?.trxid;
    const status = payload.status || payload.data?.status;
    const amount = Number(payload.amount || payload.data?.amount);

    if (!eventId || !trxid) {
      return NextResponse.json({ error: "Payload tidak lengkap" }, { status: 400 });
    }

    // 1. Prevent duplicate processing via webhook_events
    try {
      db.prepare(
        "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
      ).run(eventId, trxid, rawBody.slice(0, 500));
    } catch (err: any) {
      // Duplicate event_id caught by UNIQUE constraint
      return NextResponse.json({ message: "Event already processed", duplicate: true });
    }

    // 2. Fetch local transaction
    const trx = db.prepare("SELECT * FROM transaksi WHERE qris_trx_id = ?").get(trxid) as any;
    if (!trx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // 3. Process payment if paid
    if (status === "paid" || status === "berhasil" || status === "success") {
      // Validate amount if present
      if (amount && Math.abs(amount - trx.jumlah) > 1) {
        return NextResponse.json({ error: "Nominal tidak sesuai" }, { status: 400 });
      }

      // Update to berhasil, even if local status was expired (qriskuu takes precedence)
      db.prepare(
        "UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(trx.id);
    } else if (status === "expired" || status === "failed") {
      if (trx.status === "pending") {
        db.prepare("UPDATE transaksi SET status = 'expired' WHERE id = ?").run(trx.id);
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 500 });
  }
}
