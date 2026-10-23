import crypto from "node:crypto";
import { getSetting } from "./db";

const QRISKUU_BASE_URL = process.env.QRISKUU_BASE_URL || "https://qriskuu.com";

export interface CreatePaymentResponse {
  trxid: string;
  qr_url: string;
  qr_string?: string;
  expired_at: string;
  amount?: number;
  base_amount?: number;
  fee?: number;
  is_mock?: boolean;
}

export async function createQrisPayment(amount: number, note: string): Promise<CreatePaymentResponse> {
  const apiKey = getSetting("qriskuu_api_key") || process.env.QRISKUU_API_KEY || "";

  // Kode unik acak 1-10 rupiah agar mutasi ShopeePay/bank terbaca instan tanpa clash/delay
  const uniqueFee = Math.floor(Math.random() * 10) + 1;

  // If real API key is configured, call official qriskuu REST API
  if (apiKey) {
    try {
      let res = await fetch(`${QRISKUU_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          amount,
          fee: uniqueFee,
          method: "shoppee",
          customer_name: note || "Mahasiswa",
        }),
      });

      // Handle DUPLICATE_PENDING: auto-cancel existing pending payment with same amount on gateway, then retry
      if (res.status === 400) {
        const errJson = await res.clone().json().catch(() => null);
        if (errJson?.errors?.code === "DUPLICATE_PENDING") {
          try {
            const listRes = await fetch(`${QRISKUU_BASE_URL}/payments?status=pending`, {
              headers: { "X-API-Key": apiKey },
            });
            const listData = await listRes.json();
            const dups = (listData?.data || []).filter((d: any) => Number(d.amount) === Number(amount));
            for (const d of dups) {
              await fetch(`${QRISKUU_BASE_URL}/payments/${encodeURIComponent(d.id)}/cancel`, {
                method: "POST",
                headers: { "X-API-Key": apiKey },
              });
            }
            // Retry create after clearing duplicate
            res = await fetch(`${QRISKUU_BASE_URL}/payments`, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-API-Key": apiKey,
              },
              body: JSON.stringify({
                amount,
                fee: uniqueFee,
                method: "shoppee",
                customer_name: note || "Mahasiswa",
              }),
            });
          } catch {}
        }
      }

      if (res.ok) {
        const json = await res.json();
        const item = json.data || json;
        const trxid = item.id || item.trxid;
        if (!trxid) {
          throw new Error("ID transaksi tidak ditemukan dari gateway pembayaran");
        }

        let expiredAt = item.expired_at;
        if (typeof expiredAt === "number") {
          expiredAt = new Date(expiredAt * 1000).toISOString();
        } else if (!expiredAt) {
          expiredAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
        }

        return {
          trxid,
          qr_url: item.qr_url,
          qr_string: item.qr_string,
          expired_at: expiredAt,
          amount: Number(item.amount || (amount + uniqueFee)),
          base_amount: amount,
          fee: uniqueFee,
          is_mock: false,
        };
      }
      console.warn("qriskuu API returned non-200, falling back to simulator:", await res.text());
    } catch (err: any) {
      if (err?.message && !err.message.includes("fetch")) {
        throw err;
      }
      console.warn("qriskuu API call failed, falling back to simulator:", err);
    }
  }

  // Simulator mode (ponytail: mock SVG QR code when API key not set or during testing)
  const trxid = `qsim${Math.random().toString(36).substring(2, 6)}`;
  const expired_at = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  
  // Clean QR placeholder SVG URL
  const qr_url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021226${trxid}520458125303360540${amount}5802ID5916TABUNGANE-SISFOR`;

  return {
    trxid,
    qr_url,
    expired_at,
    is_mock: true,
  };
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  try {
    const secret = getSetting("qriskuu_webhook_secret") || process.env.QRISKUU_WEBHOOK_SECRET || "sim_webhook_secret_2026";
    const cleanSignature = signatureHeader.replace(/^sha256=/, "").trim();
    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    
    const sigBuf = Buffer.from(cleanSignature, "hex");
    const compBuf = Buffer.from(computed, "hex");
    if (sigBuf.length === 0 || sigBuf.length !== compBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch {
    return false;
  }
}

export async function syncQriskuuWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  const apiKey = getSetting("qriskuu_api_key") || process.env.QRISKUU_API_KEY || "";
  if (!apiKey) return { success: false, message: "API key qriskuu belum diatur" };

  try {
    const res = await fetch(`${QRISKUU_BASE_URL}/merchant/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        webhook: webhookUrl,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: "Webhook qriskuu berhasil diperbarui!" };
    }
    const errText = await res.text();
    return { success: false, message: `Gagal memperbarui webhook: ${errText}` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
