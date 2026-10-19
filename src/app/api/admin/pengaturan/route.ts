import { NextResponse } from "next/server";
import { getCurrentUser, logAudit } from "@/lib/auth";
import { getSetting, setSetting } from "@/lib/db";

const DEFAULT_BASE_URL = "https://qriskuu.web.id";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/webhook`;

  const apiKey = getSetting("qriskuu_api_key") || process.env.QRISKUU_API_KEY || "";
  const webhookSecret = getSetting("qriskuu_webhook_secret") || process.env.QRISKUU_WEBHOOK_SECRET || "";
  const baseUrl = getSetting("qriskuu_base_url") || process.env.QRISKUU_BASE_URL || DEFAULT_BASE_URL;

  let connectionStatus = "simulator_mode";
  if (apiKey) {
    try {
      const res = await fetch(`${baseUrl}/health`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        signal: AbortSignal.timeout(4000),
      });
      connectionStatus = res.ok ? "connected" : "api_unreachable";
    } catch {
      connectionStatus = "connection_error";
    }
  }

  return NextResponse.json({
    webhook_url: webhookUrl,
    qriskuu_base_url: baseUrl,
    has_api_key: Boolean(apiKey),
    api_key_masked: apiKey ? `${apiKey.slice(0, 3)}***` : "",
    has_webhook_secret: Boolean(webhookSecret),
    connection_status: connectionStatus,
    limits: {
      min_topup: 1000,
      max_topup: 1000000,
    },
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { api_key, webhook_secret } = await req.json();

    if (api_key !== undefined) {
      setSetting("qriskuu_api_key", String(api_key).trim());
    }
    if (webhook_secret !== undefined) {
      setSetting("qriskuu_webhook_secret", String(webhook_secret).trim());
    }

    logAudit(user.id, "UPDATE_PENGATURAN", "qriskuu", "Memperbarui konfigurasi API Key / Secret qriskuu");
    return NextResponse.json({ success: true, message: "Pengaturan berhasil disimpan" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
