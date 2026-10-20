import crypto from "node:crypto";
import { getSetting } from "./db";

const QRISKUU_BASE_URL = process.env.QRISKUU_BASE_URL || "https://qriskuu.com";

export interface CreatePaymentResponse {
  trxid: string;
  qr_url: string;
  qr_string?: string;
  expired_at: string;
  is_mock?: boolean;
}

export async function createQrisPayment(amount: number, note: string): Promise<CreatePaymentResponse> {
  const apiKey = getSetting("qriskuu_api_key") || process.env.QRISKUU_API_KEY || "";

  // If real API key is configured, call official qriskuu REST API
  if (apiKey) {
    try {
      const res = await fetch(`${QRISKUU_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({
          amount,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          trxid: data.id || data.trxid,
          qr_url: data.qr_url,
          qr_string: data.qr_string,
          expired_at: data.expired_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          is_mock: false,
        };
      }
      console.warn("qriskuu API returned non-200, falling back to simulator:", await res.text());
    } catch (err) {
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
