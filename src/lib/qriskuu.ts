import crypto from "node:crypto";

const QRISKUU_BASE_URL = process.env.QRISKUU_BASE_URL || "https://api.qriskuu.com/v1";
const QRISKUU_API_KEY = process.env.QRISKUU_API_KEY || "";
const QRISKUU_WEBHOOK_SECRET = process.env.QRISKUU_WEBHOOK_SECRET || "sim_webhook_secret_2026";

export interface CreatePaymentResponse {
  trxid: string;
  qr_url: string;
  qr_string?: string;
  expired_at: string;
  is_mock?: boolean;
}

export async function createQrisPayment(amount: number, note: string): Promise<CreatePaymentResponse> {
  // If real API key is present, attempt live qriskuu API
  if (QRISKUU_API_KEY) {
    try {
      const res = await fetch(`${QRISKUU_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${QRISKUU_API_KEY}`,
        },
        body: JSON.stringify({
          amount,
          note,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          trxid: data.trxid || data.id,
          qr_url: data.qr_url || data.qr_image,
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
  const trxid = `QSIM-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
    const computed = crypto
      .createHmac("sha256", QRISKUU_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(computed));
  } catch {
    return false;
  }
}
