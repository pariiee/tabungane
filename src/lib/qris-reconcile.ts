import { db } from "./db";
import { creditPayment } from "./ledger";
import { getAlpayStatus } from "./alpay";

export async function runQrisReconcileJob() {
  try {
    // 1. Fetch pending topup_qris created > 5 seconds ago, max 20 per cycle
    const pendingTrxs = db
      .prepare(
        `SELECT * FROM transaksi 
         WHERE status = 'pending' 
           AND tipe = 'topup_qris' 
           AND qris_trx_id IS NOT NULL 
           AND created_at <= datetime('now', '-5 seconds')
         ORDER BY created_at ASC 
         LIMIT 20`
      )
      .all() as any[];

    if (!pendingTrxs || pendingTrxs.length === 0) return;

    for (const trx of pendingTrxs) {
      const trxid = trx.qris_trx_id;
      if (!trxid) continue;

      try {
        const json = await getAlpayStatus(trxid);
        const data = json.data || json;
        const remoteStatus = String(json.status || data.status || "").toLowerCase();
        const isPaid = json.paid === true || remoteStatus === "paid" || remoteStatus === "berhasil";

        if (isPaid) {
          const paidAmount = Number(data.amount || trx.jumlah);
          creditPayment(
            trxid,
            `recon-${trxid}-${Date.now()}`,
            JSON.stringify(json),
            paidAmount
          );
        } else if (remoteStatus === "expired" || remoteStatus === "canceled" || remoteStatus === "cancelled") {
          const normalized = remoteStatus === "cancelled" ? "canceled" : remoteStatus;
          db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(normalized, trx.id);
        }
      } catch (err: any) {
        console.warn(`[RECONCILE] Error checking status for ${trxid}:`, err.message);
      }

      // 1 second pause between checks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err: any) {
    console.error("[RECONCILE JOB ERROR]:", err.message);
  }
}

export function startQrisReconcileDaemon() {
  const globalForCron = global as unknown as { qrisJobStarted?: boolean; qrisInterval?: any };
  if (globalForCron.qrisJobStarted) {
    return;
  }
  globalForCron.qrisJobStarted = true;

  console.log("[RECONCILE] QRIS fallback status checker started (interval: 15s)");

  // Run initially after 3s warmup
  setTimeout(() => {
    runQrisReconcileJob();
  }, 3000);

  // Repeat every 15 seconds
  globalForCron.qrisInterval = setInterval(() => {
    runQrisReconcileJob();
  }, 15000);
}
