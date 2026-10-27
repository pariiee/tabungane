import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db, getSetting } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ trxid: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const trxid = resolvedParams.trxid;
    if (!trxid) {
      return NextResponse.json({ error: "ID transaksi tidak valid" }, { status: 400 });
    }

    // Find transaction
    const trx = db
      .prepare("SELECT * FROM transaksi WHERE id = ? OR qris_trx_id = ?")
      .get(trxid, trxid) as any;

    if (!trx) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Authorization: only the owner or super_admin / admin can cancel
    if (trx.user_id !== user.id && user.role !== "super_admin" && user.role !== "admin") {
      return NextResponse.json({ error: "Anda tidak memiliki akses untuk membatalkan tagihan ini" }, { status: 403 });
    }

    if (trx.status !== "pending") {
      return NextResponse.json(
        { error: `Tagihan tidak dapat dibatalkan karena status saat ini: ${trx.status}` },
        { status: 400 }
      );
    }

    // 1. Guard: Check if payment was actually completed on Alpay before canceling
    if (trx.qris_trx_id && !trx.qris_trx_id.startsWith("qsim")) {
      try {
        const { getAlpayStatus, cancelAlpayPayment } = require("@/lib/alpay");
        const statusJson = await getAlpayStatus(trx.qris_trx_id).catch(() => null);
        if (statusJson) {
          const statusData = statusJson.data || statusJson;
          const remoteStatus = String(statusJson.status || statusData.status || "").toLowerCase();
          const isPaid = statusJson.paid === true || remoteStatus === "paid" || remoteStatus === "berhasil";
          if (isPaid) {
            const { creditPayment } = require("@/lib/ledger");
            creditPayment(
              trx.qris_trx_id,
              `cancel-check-${trx.qris_trx_id}-${Date.now()}`,
              JSON.stringify(statusJson),
              statusData.amount ? Number(statusData.amount) : trx.jumlah
            );
            return NextResponse.json({
              success: true,
              message: "Pembayaran telah berhasil terverifikasi!",
              status: "berhasil",
            });
          }
        }

        // If not paid, call cancel on Alpay
        await cancelAlpayPayment(trx.qris_trx_id);
      } catch {}
    }

    // 2. Mark canceled locally
    db.prepare("UPDATE transaksi SET status = 'canceled' WHERE id = ?").run(trx.id);

    return NextResponse.json({
      success: true,
      message: "Tagihan berhasil dibatalkan",
      status: "canceled",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal membatalkan tagihan" }, { status: 500 });
  }
}
