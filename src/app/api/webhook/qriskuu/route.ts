import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/qriskuu";
import { creditPayment } from "@/lib/ledger";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");

    // Strict signature check
    const isValidSignature = verifyWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      console.warn("[WEBHOOK] Invalid signature attempt. Header:", signature);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Log raw payload
    console.log("[WEBHOOK RAW PAYLOAD]:", rawBody);

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventId = payload.event_id || payload.id || payload.eventId;
    if (!eventId) {
      return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
    }

    // Dedup via event_id
    const alreadyProcessed = db
      .prepare("SELECT event_id FROM webhook_events WHERE event_id = ?")
      .get(eventId);
    if (alreadyProcessed) {
      return NextResponse.json({ message: "Event already processed", duplicate: true }, { status: 200 });
    }

    const event = String(payload.event || "").toLowerCase();
    const status = String(payload.status || payload.data?.status || "").toLowerCase();
    const isPaid = status === "paid" || status === "berhasil" || event === "payment.paid";

    const trxid = String(
      payload.trxid ||
      payload.data?.trxid ||
      payload.id ||
      payload.data?.id ||
      payload.qris_trx_id ||
      ""
    ).trim();

    const amount = Number(payload.amount ?? payload.data?.amount ?? 0);

    if (!trxid) {
      logAudit("system", "webhook_missing_trxid", eventId, `Payload missing trxid: ${rawBody.slice(0, 200)}`);
      return NextResponse.json({ error: "Missing transaction identifier" }, { status: 400 });
    }

    if (isPaid) {
      const result = creditPayment(trxid, eventId, rawBody, amount > 0 ? amount : undefined);
      if (!result.success) {
        return NextResponse.json({ error: result.error || "Gagal memproses pembayaran" }, { status: 400 });
      }
      return NextResponse.json({ success: true, processed: true });
    }

    if (status === "expired" || status === "canceled" || event === "payment.expired" || event === "payment.canceled") {
      const trx = db.prepare("SELECT id, status FROM transaksi WHERE qris_trx_id = ?").get(trxid) as any;
      if (trx && trx.status === "pending") {
        db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(
          status === "canceled" ? "canceled" : "expired",
          trx.id
        );
      }
      try {
        db.prepare(
          "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
        ).run(eventId, trxid, rawBody.slice(0, 500));
      } catch {}
      return NextResponse.json({ success: true, status_updated: status });
    }

    return NextResponse.json({ received: true, event });
  } catch (err: any) {
    console.error("[WEBHOOK ERROR]:", err);
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 500 });
  }
}
