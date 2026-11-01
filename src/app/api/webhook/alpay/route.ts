import { NextResponse } from "next/server";
import { verifyAlpayWebhookSignature } from "@/lib/alpay";
import { creditPayment } from "@/lib/ledger";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    // Strict HMAC SHA-256 signature check
    const isValidSignature = verifyAlpayWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn("[ALPAY WEBHOOK] Invalid signature attempt. Header:", signature);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const event = String(payload.event || "").toLowerCase();
    const data = payload.data || payload;
    const trxid = String(data.id || data.trxid || "").trim();
    const status = String(data.status || "").toLowerCase();
    const isPaid = status === "paid" || status === "berhasil" || event === "payment.paid" || data.paid === true;
    const amount = Number(data.amount || 0);

    const eventId = payload.event_id || `alpay_${trxid}_${data.paid_at || Date.now()}`;

    // Dedup via event_id
    const alreadyProcessed = db
      .prepare("SELECT event_id FROM webhook_events WHERE event_id = ?")
      .get(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ message: "Event already processed", duplicate: true }, { status: 200 });
    }

    if (!trxid) {
      return NextResponse.json({ error: "Missing transaction identifier" }, { status: 400 });
    }

    if (isPaid) {
      const result = creditPayment(trxid, eventId, rawBody, amount > 0 ? amount : undefined);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Gagal memproses pembayaran" }, { status: 400 });
      }
      return NextResponse.json({ success: true, processed: true });
    }

    if (status === "expired" || status === "canceled" || status === "cancelled") {
      const trx = db.prepare("SELECT id, status FROM transaksi WHERE qris_trx_id = ?").get(trxid) as any;
      if (trx && trx.status === "pending") {
        db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(
          status === "expired" ? "expired" : "canceled",
          trx.id
        );
      }
      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
