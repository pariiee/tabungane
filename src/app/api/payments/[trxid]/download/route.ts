import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ trxid: string }> }
) {
  try {
    const { trxid } = await params;
    if (!trxid) {
      return new NextResponse("Transaction ID required", { status: 400 });
    }

    const qrUrl = `https://pay.ghifari.biz.id/img/qr-${trxid}.png`;
    const res = await fetch(qrUrl);
    if (!res.ok) {
      return new NextResponse("QR image not found", { status: 404 });
    }

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="QRIS-${trxid}.png"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
