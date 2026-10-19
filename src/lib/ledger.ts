import { db, runTransaction } from "./db";
import { logAudit } from "./auth";

export interface CreditPaymentResult {
  success: boolean;
  duplicate?: boolean;
  already_paid?: boolean;
  credited?: boolean;
  error?: string;
}

/**
 * Idempotent function to credit a paid QRIS payment across webhook & background status check
 */
export function creditPayment(
  trxid: string,
  eventId: string,
  rawPayload: string,
  paidAmount?: number
): CreditPaymentResult {
  // 1. Check duplicate event_id first
  const existingEvent = db
    .prepare("SELECT event_id FROM webhook_events WHERE event_id = ?")
    .get(eventId);
  if (existingEvent) {
    return { success: true, duplicate: true };
  }

  // 2. Fetch local transaction
  const trx = db
    .prepare("SELECT * FROM transaksi WHERE qris_trx_id = ?")
    .get(trxid) as any;

  if (!trx) {
    logAudit("system", "credit_payment_rejected", trxid, "Transaksi tidak ditemukan di database lokal");
    return { success: false, error: "Transaksi tidak ditemukan" };
  }

  if (trx.tipe !== "topup_qris") {
    logAudit("system", "credit_payment_rejected", trxid, `Tipe transaksi bukan topup_qris: ${trx.tipe}`);
    return { success: false, error: "Bukan transaksi QRIS" };
  }

  // If already marked berhasil, record event to prevent future replays and return cleanly
  if (trx.status === "berhasil") {
    try {
      db.prepare(
        "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
      ).run(eventId, trxid, rawPayload.slice(0, 500));
    } catch {}
    return { success: true, already_paid: true };
  }

  // Only allow crediting pending or expired transactions (qris official paid takes precedence over expired)
  if (trx.status !== "pending" && trx.status !== "expired") {
    logAudit("system", "credit_payment_rejected", trxid, `Status transaksi tidak valid untuk kredit: ${trx.status}`);
    return { success: false, error: `Status transaksi tidak valid: ${trx.status}` };
  }

  // 3. Strict amount check
  if (paidAmount !== undefined && paidAmount !== null && Number(paidAmount) > 0) {
    if (Math.round(Number(paidAmount)) !== Math.round(Number(trx.jumlah))) {
      const msg = `Nominal webhook/qriskuu (Rp ${paidAmount}) tidak cocok dengan tagihan lokal (Rp ${trx.jumlah})`;
      console.warn(`[AUDIT] ${msg} for trxid ${trxid}`);
      logAudit("system", "nominal_mismatch", trxid, msg);
      return { success: false, error: msg };
    }
  }

  // 4. Wrap database mutation in BEGIN IMMEDIATE ... COMMIT
  return runTransaction(() => {
    // Insert webhook_events
    db.prepare(
      "INSERT INTO webhook_events (event_id, qris_trx_id, ringkasan_payload) VALUES (?, ?, ?)"
    ).run(eventId, trxid, rawPayload.slice(0, 500));

    // Update transaksi to berhasil
    db.prepare(
      "UPDATE transaksi SET status = 'berhasil', paid_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(trx.id);

    return { success: true, credited: true };
  });
}
