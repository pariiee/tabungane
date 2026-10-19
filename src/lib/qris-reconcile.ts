import { db } from "./db";
import { creditPayment } from "./ledger";

const QRISKUU_BASE_URL = process.env.QRISKUU_BASE_URL || "https://qriskuu.web.id";

export async function runQrisReconcileJob() {
  try {
    // 1. Fetch pending topup_qris created > 60 seconds ago, max 20 per cycle
    const pendingTrxs = db
      .prepare(
        `SELECT * FROM transaksi 
         WHERE status = 'pending' 
           AND tipe = 'topup_qris' 
           AND qris_trx_id IS NOT NULL 
           AND created_at <= datetime('now', '-60 seconds')
         ORDER BY created_at ASC 
         LIMIT 20`
      )
      .all() as any[];

    if (!pendingTrxs || pendingTrxs.length === 0) return;

    for (const trx of pendingTrxs) {
      const trxid = trx.qris_trx_id;
      if (!trxid) continue;

      try {
        const res = await fetch(`${QRISKUU_BASE_URL}/payments/${encodeURIComponent(trxid)}/status`, {
          signal: AbortSignal.timeout(5000),
        });

        if (res.ok) {
          const data = await res.json();
          const remoteStatus = String(data.status || "").toLowerCase();

          if (remoteStatus === "paid" || remoteStatus === "berhasil") {
            const paidAmount = Number(data.amount || trx.jumlah);
            creditPayment(
              trxid,
              `recon-${trxid}-${Date.now()}`,
              JSON.stringify(data),
              paidAmount
            );
          } else if (remoteStatus === "expired" || remoteStatus === "canceled") {
            db.prepare("UPDATE transaksi SET status = ? WHERE id = ?").run(remoteStatus, trx.id);
          }
          // Note: If remoteStatus is still pending, leave as pending even if local expired_at has passed
        }
      } catch (err: any) {
        console.warn(`[RECONCILE] Error checking status for ${trxid}:`, err.message);
      }

      // 1 second pause to respect qriskuu rate limit (60 req/min per IP)
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

  console.log("[RECONCILE] QRIS fallback status checker started (interval: 90s)");

  // Run initially after 10s warmup
  setTimeout(() => {
    runQrisReconcileJob();
  }, 10000);

  // Repeat every 90 seconds
  globalForCron.qrisInterval = setInterval(() => {
    runQrisReconcileJob();
  }, 90000);
}
