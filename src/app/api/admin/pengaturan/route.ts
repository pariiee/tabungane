import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/webhook/qriskuu`;

  const hasApiKey = Boolean(process.env.QRISKUU_API_KEY);
  const baseUrl = process.env.QRISKUU_BASE_URL || "https://api.qriskuu.com/v1";

  let connectionStatus = "simulator_mode";
  if (hasApiKey) {
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(3000) });
      connectionStatus = res.ok ? "connected" : "api_unreachable";
    } catch {
      connectionStatus = "connection_error";
    }
  }

  return NextResponse.json({
    webhook_url: webhookUrl,
    qriskuu_base_url: baseUrl,
    has_api_key: hasApiKey,
    connection_status: connectionStatus,
    limits: {
      min_topup: 1000,
      max_topup: 1000000,
    },
  });
}
