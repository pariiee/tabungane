"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  RefreshCw,
  Clock,
  Check,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Link2Off,
} from "lucide-react";

export default function InvoicePage() {
  const routeParams = useParams();
  const trxid = typeof routeParams?.trxid === "string" ? routeParams.trxid : Array.isArray(routeParams?.trxid) ? routeParams.trxid[0] : "";
  const router = useRouter();

  const [payment, setPayment] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "berhasil" | "expired" | "canceled">("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState("");
  const [redirectCount, setRedirectCount] = useState(10);
  const [cancelCooldown, setCancelCooldown] = useState(10);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const redirectRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status helper
  const checkStatus = async (isManual = false) => {
    if (!trxid) return;
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/payments/${trxid}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setPayment(data);
          const rawStatus = String(data.status || "").toLowerCase();
          if (rawStatus === "berhasil" || rawStatus === "paid") {
            setPaymentStatus("berhasil");
          } else if (rawStatus === "canceled") {
            setPaymentStatus("canceled");
          } else if (rawStatus === "expired") {
            setPaymentStatus("expired");
          } else {
            setPaymentStatus("pending");
          }

          if (data.expired_at) {
            const diff = Math.max(0, Math.floor((new Date(data.expired_at).getTime() - Date.now()) / 1000));
            setTimeLeft(diff);
          }
        }
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Transaksi tidak ditemukan");
      }
    } catch (e: any) {
      if (isManual) setError(e.message);
    } finally {
      if (isManual) setRefreshing(false);
      setLoading(false);
    }
  };

  // Cooldown 10s timer untuk tombol batalkan topup
  useEffect(() => {
    if (paymentStatus === "pending") {
      const cdTimer = setInterval(() => {
        setCancelCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cdTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(cdTimer);
    }
  }, [paymentStatus]);

  // Initial load
  useEffect(() => {
    checkStatus(false);
  }, [trxid]);

  // Countdown timer for pending
  useEffect(() => {
    if (paymentStatus === "pending") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            checkStatus(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paymentStatus]);

  // Fast polling payment status every 10s
  useEffect(() => {
    if (paymentStatus === "pending") {
      pollRef.current = setInterval(() => {
        checkStatus(false);
      }, 10000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [trxid, paymentStatus]);

  // Auto-redirect countdown ONLY on canceled/expired (10s), NOT on success!
  useEffect(() => {
    if (paymentStatus === "canceled" || paymentStatus === "expired") {
      setRedirectCount(10);
      redirectRef.current = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev <= 1) {
            clearInterval(redirectRef.current!);
            router.push("/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (redirectRef.current) clearInterval(redirectRef.current);
    };
  }, [paymentStatus, router]);

  // Cancel payment action (tanpa browser native confirm)
  const handleCancelPayment = async () => {
    if (cancelCooldown > 0 || canceling) return;
    setCanceling(true);
    setError("");
    try {
      const res = await fetch(`/api/payments/${trxid}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && (data.success || data.status === "canceled")) {
        setPaymentStatus("canceled");
        setPayment((prev: any) => ({ ...prev, status: "canceled" }));
      } else {
        setError(data.error || "Gagal membatalkan tagihan");
      }
    } catch (e: any) {
      setError(e.message || "Gagal membatalkan tagihan");
    } finally {
      setCanceling(false);
    }
  };

  // Format date: "10/22/2026, 9:19:06 AM"
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateString;
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes}:${String(seconds).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="py-24 flex items-center justify-center p-4">
        <div className="text-center space-y-3 font-mono text-xs text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-black dark:text-white" />
          <p>Memuat rincian invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-md mx-auto py-16 px-4">
        <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121316] p-8 text-center space-y-4 rounded-2xl shadow-xs">
          <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500 dark:text-zinc-400">{error || "Transaksi tidak valid atau telah kedaluwarsa."}</p>
          <Link
            href="/dashboard"
            className="h-9 px-4 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black rounded-xl text-xs font-semibold inline-flex items-center justify-center w-full transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4 font-sans text-gray-900 dark:text-zinc-100">
      {/* Main Invoice Card */}
      <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121316] p-6 sm:p-8 rounded-2xl shadow-xs space-y-6">

        {/* ─── CASE A: CANCELED / EXPIRED (Exact layout as Screenshot 2) ─── */}
        {paymentStatus === "canceled" || paymentStatus === "expired" ? (
          <div className="space-y-6 text-center">
            {/* Square Gray Icon Box */}
            <div className="w-14 h-14 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 flex items-center justify-center mx-auto rounded-xl">
              <Link2Off className="w-7 h-7 stroke-[2]" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                {paymentStatus === "canceled" ? "Payment canceled" : "Payment expired"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {paymentStatus === "canceled"
                  ? "Transaksi ini telah dibatalkan."
                  : "Batas waktu pembayaran tagihan telah berakhir."}
              </p>
            </div>

            {/* 3-Second Auto Redirect Banner */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800 text-xs font-mono text-gray-600 dark:text-zinc-300 flex items-center justify-between rounded-xl">
              <span>Mengalihkan ke Dashboard dalam <strong>{redirectCount}</strong> detik...</span>
              <button
                onClick={() => router.push("/dashboard")}
                className="font-bold underline cursor-pointer hover:opacity-80"
              >
                Kembali Sekarang &rarr;
              </button>
            </div>

            {/* Divider */}
            <hr className="border-gray-100 dark:border-zinc-800" />

            {/* Transaction Details (Key-Value List) */}
            <div className="text-left pt-1">
              <div className="text-[10px] font-mono tracking-widest uppercase text-gray-400 dark:text-zinc-500 mb-3 font-semibold">
                DETAIL TRANSAKSI
              </div>
              <div className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-zinc-800/80 text-xs font-mono">
                <div className="flex justify-between py-2.5 px-3.5 bg-gray-50/50 dark:bg-zinc-900/30">
                  <span className="text-gray-500 dark:text-zinc-400">Transaction ID:</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-100">{trxid}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3.5">
                  <span className="text-gray-500 dark:text-zinc-400">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-100">Rp{payment.amount?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3.5 bg-gray-50/50 dark:bg-zinc-900/30">
                  <span className="text-gray-500 dark:text-zinc-400">Status:</span>
                  <span className={`font-bold uppercase ${paymentStatus === "canceled" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 px-3.5">
                  <span className="text-gray-500 dark:text-zinc-400">Created:</span>
                  <span className="text-gray-700 dark:text-zinc-300">{formatDate(payment.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : paymentStatus === "berhasil" ? (
          /* ─── CASE B: SUCCESS / PAID STATE (Sesuai Desain Receipt QRISku) ─── */
          <div className="space-y-5 text-center">
            {/* Center Checkmark Box (Kotak hitam dengan centang putih) */}
            <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto rounded-xl shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>

            {/* Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                Payment successful
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Thank you, your payment has been received.
              </p>
            </div>

            {/* Divider */}
            <hr className="border-gray-200/80 dark:border-zinc-800/80 my-2" />

            {/* Transaction Details */}
            <div className="text-left">
              <div className="text-[11px] font-mono tracking-wider uppercase text-gray-400 dark:text-zinc-500 mb-2 font-semibold">
                DETAIL TRANSAKSI
              </div>
              <div className="divide-y divide-gray-100 dark:divide-zinc-800/80 text-xs">
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 dark:text-zinc-400">Transaction ID:</span>
                  <span className="font-mono font-medium text-gray-900 dark:text-zinc-100">{payment.id || trxid}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 dark:text-zinc-400">Total:</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-zinc-100">
                    Rp{(payment.amount || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 dark:text-zinc-400">Status:</span>
                  <span className="font-mono text-gray-900 dark:text-zinc-100 lowercase">
                    {payment.status === "berhasil" ? "paid" : (payment.status || "paid")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 dark:text-zinc-400">Created:</span>
                  <span className="font-mono text-gray-700 dark:text-zinc-300">{formatDate(payment.created_at)}</span>
                </div>
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-gray-500 dark:text-zinc-400">Paid:</span>
                  <span className="font-mono text-gray-700 dark:text-zinc-300">{formatDate(payment.paid_at || payment.updated_at || new Date().toISOString())}</span>
                </div>
                {(payment.payment_reference_id || payment.reference || payment.trxid) && (
                  <div className="flex justify-between items-start py-2.5 gap-2">
                    <span className="text-gray-500 dark:text-zinc-400 shrink-0">Reference:</span>
                    <span className="font-mono text-[11px] text-gray-700 dark:text-zinc-300 text-right break-all">
                      {payment.payment_reference_id || payment.reference || payment.trxid}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button: Kembali ke Dashboard */}
              <div className="pt-5">
                <Link
                  href="/dashboard"
                  className="w-full h-10 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs active:scale-95"
                >
                  <span>Kembali ke Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* ─── CASE C: PENDING STATE (Payment Waiting) ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Total & QR Code */}
            <div className="space-y-4 text-center md:text-left">
              {/* Big Total */}
              <div>
                <span className="text-[11px] font-mono uppercase text-gray-400 dark:text-zinc-500 font-semibold tracking-wider block mb-1">
                  TOTAL TAGIHAN
                </span>
                <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-gray-900 dark:text-zinc-100">
                  Rp{payment.amount?.toLocaleString("id-ID")}
                </div>
              </div>

              {/* QR Code Box */}
              <div className="inline-block p-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-white rounded-xl shadow-xs">
                <img
                  src={
                    payment.qr_url ||
                    `https://pay.ghifari.biz.id/img/qr-${trxid}.png`
                  }
                  alt="QRIS Payment"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                  onError={(e) => {
                    const fallback = `https://pay.ghifari.biz.id/img/qr-${trxid}.png`;
                    if ((e.target as HTMLImageElement).src !== fallback) {
                      (e.target as HTMLImageElement).src = fallback;
                    }
                  }}
                />
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                <span className="text-gray-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">WAKTU TERSISA</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-sm ml-1 font-mono">
                  {timeFormatted}
                </span>
              </div>
            </div>

            {/* Right Column: Rincian Pembayaran & Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400 dark:text-zinc-500 font-semibold">
                  RINCIAN PEMBAYARAN
                </span>
                <span className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 rounded-md text-[10px] font-mono uppercase text-gray-700 dark:text-zinc-300 font-bold">
                  {payment.channel || "SHOPEEPAY"}
                </span>
              </div>

              {/* Transaction Key-Values */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800/60 gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">Transaction ID:</span>
                  <span className="font-bold text-gray-900 dark:text-zinc-100 truncate text-right">{payment?.qris_trx_id || trxid}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800/60 gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">Total Tagihan:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono text-right">Rp{payment?.amount?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800/60 gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-right">
                    {paymentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800/60 gap-2">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">Created:</span>
                  <span className="text-gray-700 dark:text-zinc-300 text-right">{formatDate(payment?.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {/* Check Status Button */}
                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={refreshing}
                  className="w-full h-10 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold rounded-xl tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Check payment status</span>
                </button>

                {/* Batalkan Topup Button with 10s Cooldown */}
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={canceling || cancelCooldown > 0}
                  className={`w-full h-10 border text-xs font-semibold rounded-xl tracking-wide flex items-center justify-center gap-2 transition-all ${
                    cancelCooldown > 0 || canceling
                      ? "border-gray-200 dark:border-zinc-800 bg-gray-100 dark:bg-zinc-900 text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-70"
                      : "border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 cursor-pointer active:scale-95"
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>
                    {canceling
                      ? "Membatalkan..."
                      : cancelCooldown > 0
                      ? `Batalkan Topup (${cancelCooldown}s)`
                      : "Batalkan Topup"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── CARD FOOTER ─── */}
        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 text-center text-[11px] font-mono text-gray-400 dark:text-zinc-500">
          <span>Powered by NGECODE AJA</span>
        </div>
      </div>
    </div>
  );
}

