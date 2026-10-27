import crypto from "node:crypto";
import { getSetting } from "./db";

export const ALPAY_BASE_URL = process.env.ALPAY_BASE_URL || "https://pay.ghifari.biz.id";

export function getAlpayApiKey(): string {
  return getSetting("alpay_api_key") || process.env.ALPAY_API_KEY || "";
}

export interface AlpayCreateResponse {
  trxid: string;
  qr_url: string;
  payment_url: string;
  expired_at: string;
  amount: number;
  base_amount: number;
  fee: number;
}

/**
 * Buat tagihan pembayaran dynamic QRIS via Alpay Gateway
 */
export async function createAlpayPayment(
  amount: number,
  customerName: string = "Mahasiswa",
  note: string = "Top Up Sakune",
  validMinutes: number = 5
): Promise<AlpayCreateResponse> {
  const apiKey = getAlpayApiKey();

  const res = await fetch(`${ALPAY_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      amount,
      fee: 0,
      customer_name: customerName,
      note,
      valid_minutes: validMinutes,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error || json.message || "Gagal membuat tagihan pembayaran di Alpay");
  }

  const d = json.data;
  return {
    trxid: d.id,
    qr_url: d.qr_image,
    payment_url: d.payment_url,
    expired_at: d.expires_at,
    amount: d.amount,
    base_amount: d.base_amount || amount,
    fee: d.fee || 0,
  };
}

/**
 * Cek status pembayaran real-time dari Alpay Gateway
 */
export async function getAlpayStatus(trxid: string) {
  const apiKey = getAlpayApiKey();
  const res = await fetch(`${ALPAY_BASE_URL}/payments/${encodeURIComponent(trxid)}/status`, {
    headers: {
      Accept: "application/json",
      "X-API-Key": apiKey,
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || err?.message || "Transaksi tidak ditemukan di Alpay");
  }

  return await res.json();
}

/**
 * Batalkan tagihan pending di Alpay Gateway
 */
export async function cancelAlpayPayment(trxid: string) {
  const apiKey = getAlpayApiKey();
  const res = await fetch(`${ALPAY_BASE_URL}/payments/${encodeURIComponent(trxid)}/cancel`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    signal: AbortSignal.timeout(8000),
  });

  return await res.json().catch(() => ({}));
}

/**
 * Verifikasi signature webhook Alpay menggunakan HMAC SHA-256
 */
export function verifyAlpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const apiKey = getAlpayApiKey();
  const expected = crypto.createHmac("sha256", apiKey).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return signature === expected;
  }
}
