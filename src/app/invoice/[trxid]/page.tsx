"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  Moon,
  Sun,
  Zap,
} from "lucide-react";

export default function InvoicePage({ params }: { params: Promise<{ trxid: string }> }) {
  const resolvedParams = use(params);
  const trxid = resolvedParams.trxid;
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [payment, setPayment] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "berhasil" | "expired">("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [redirectCount, setRedirectCount] = useState(5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const redirectRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch status helper
  const checkStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/payments/${trxid}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) {
          setError(data.error);
        } else {
          setPayment(data);
          if (data.status === "berhasil") {
            setPaymentStatus("berhasil");
          } else if (data.status === "expired") {
            setPaymentStatus("expired");
          }
        }
      }
    } catch (e: any) {
      if (isManual) setError(e.message);
    } finally {
      if (isManual) setRefreshing(false);
      setLoading(false);
    }
  };

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
            setPaymentStatus("expired");
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

  // Polling payment status every 15s to prevent rate limit / ban
  useEffect(() => {
    if (paymentStatus === "pending") {
      pollRef.current = setInterval(() => {
        checkStatus(false);
      }, 15000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [trxid, paymentStatus]);

  // Auto-redirect countdown on success / paid
  useEffect(() => {
    if (paymentStatus === "berhasil") {
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

  // Sandbox simulation trigger
  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`/api/payments/${trxid}/status?simulate_pay=1`);
      const data = await res.json();
      if (data.status === "berhasil") {
        setPaymentStatus("berhasil");
        setPayment((prev: any) => ({
          ...prev,
          status: "berhasil",
          paid_at: data.paid_at || new Date().toISOString(),
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
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
      <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] flex items-center justify-center p-4">
        <div className="text-center space-y-3 font-mono text-xs text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-black dark:text-white" />
          <p>Memuat rincian invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] flex items-center justify-center p-4">
        <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#121316] p-8 max-w-sm w-full text-center space-y-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-bold text-black dark:text-white">Invoice Tidak Ditemukan</h2>
          <p className="text-xs text-gray-500">{error || "Transaksi tidak valid atau telah kedaluwarsa."}</p>
          <Link
            href="/dashboard"
            className="h-9 px-4 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black rounded-none text-xs font-semibold inline-flex items-center justify-center w-full"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const shareText = `Invoice Pembayaran SAKUNE SISFOR (ID: ${trxid}, Total: Rp${(payment.amount || 0).toLocaleString("id-ID")})`;
  const shareWhatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText} - Lihat invoice: ${typeof window !== "undefined" ? window.location.href : ""}`
  )}`;

  return (
    <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] text-[#111215] dark:text-[#f4f3ef] flex items-center justify-center p-4 sm:p-6 relative font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Subtle graph grid background (matches screenshot) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Main Container Card (Exact styling from screenshot) */}
      <div className="relative max-w-2xl w-full border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#121316] p-6 sm:p-8 rounded-none shadow-sm z-10 space-y-6">
        {/* Technical Corner Ticks */}
        <span className="tick -top-[5px] -left-[6px]" />
        <span className="tick -top-[5px] -right-[5px]" />
        <span className="tick -bottom-[5px] -left-[6px]" />
        <span className="tick -bottom-[5px] -right-[5px]" />

        {/* ─── 1. CARD HEADER ─── */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            {/* Merchant Square Logo */}
            <div className="w-7 h-7 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold font-mono text-xs">
              S
            </div>
            <span className="font-bold text-sm tracking-wider text-black dark:text-white uppercase">
              SAKUNE SISFOR
            </span>
          </div>

          {/* Dark Mode Toggle Button */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-8 h-8 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Ganti Mode Tampilan"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* ─── 2. INVOICE CONTENT: PENDING vs PAID ─── */}
        {paymentStatus === "berhasil" ? (
          /* ─── A. PAID / SUCCESS STATE (Matches screenshot 3) ─── */
          <div className="space-y-6 text-center">
            {/* Center Checkmark Box */}
            <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mx-auto rounded-none">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-black dark:text-white">
                Payment successful
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Thank you, your payment has been received.
              </p>
            </div>

            {/* Auto-redirect Banner */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>Mengalihkan ke Dashboard dalam <strong>{redirectCount}</strong> detik...</span>
              <button
                onClick={() => router.push("/dashboard")}
                className="font-bold underline cursor-pointer hover:opacity-80"
              >
                Kembali Sekarang &rarr;
              </button>
            </div>

            {/* Transaction Details (Table-like Key-Value List) */}
            <div className="text-left pt-2">
              <div className="text-[10px] font-mono tracking-widest uppercase text-gray-400 dark:text-zinc-500 mb-3 font-semibold">
                D E T A I L &nbsp; T R A N S A K S I
              </div>
              <div className="border border-gray-200 dark:border-zinc-800 divide-y divide-gray-100 dark:divide-zinc-800/80 text-xs font-mono">
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-bold text-black dark:text-white">{trxid}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-black dark:text-white">Rp{payment.amount?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold text-black dark:text-white">paid</span>
                </div>
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-700 dark:text-zinc-300">{formatDate(payment.created_at)}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Paid:</span>
                  <span className="text-gray-700 dark:text-zinc-300">{formatDate(payment.paid_at || new Date().toISOString())}</span>
                </div>
                <div className="flex justify-between py-2.5 px-3">
                  <span className="text-gray-500">Reference:</span>
                  <span className="text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">
                    {payment.ref_transaksi_id || `TRX-${trxid.slice(0, 12)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ─── B. PENDING STATE (Matches screenshot 1 & 2) ─── */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Total & QR Code */}
            <div className="space-y-4 text-center md:text-left">
              {/* Big Total */}
              <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-black dark:text-white">
                Rp{payment.amount?.toLocaleString("id-ID")}
              </div>

              {/* QR Code Box */}
              <div className="inline-block p-4 border border-gray-200 dark:border-zinc-800 bg-white rounded-none shadow-xs">
                <img
                  src={
                    payment.qr_url ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
                      payment.qr_string || ""
                    )}`
                  }
                  alt="QRIS Payment"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto"
                />
              </div>

              {/* Countdown Timer */}
              {paymentStatus === "pending" ? (
                <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-mono">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">WAKTU TERSISA</span>
                  <span className="font-bold text-amber-600 dark:text-amber-500 text-sm ml-1">
                    {timeFormatted}
                  </span>
                </div>
              ) : (
                <div className="text-xs font-mono text-rose-600 font-bold">
                  KODE PEMBAYARAN KEDALUWARSA
                </div>
              )}
            </div>

            {/* Right Column: Rincian Pembayaran & Actions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-2">
                <span className="text-[11px] font-mono tracking-wider uppercase text-gray-400 dark:text-zinc-500 font-semibold">
                  RINCIAN PEMBAYARAN
                </span>
                <span className="px-2 py-0.5 border border-gray-300 dark:border-zinc-700 text-[10px] font-mono uppercase text-gray-700 dark:text-zinc-300">
                  {payment.channel || "QRIS"}
                </span>
              </div>

              {/* Transaction Key-Values */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800/60">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="font-bold text-black dark:text-white">{trxid}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800/60">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-black dark:text-white">Rp{payment.amount?.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800/60">
                  <span className="text-gray-500">Status:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-500">
                    {paymentStatus}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800/60">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-700 dark:text-zinc-300">{formatDate(payment.created_at)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                {/* Check Status Button */}
                <button
                  type="button"
                  onClick={() => checkStatus(true)}
                  disabled={refreshing}
                  className="w-full h-10 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold rounded-none tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  <span>Check payment status</span>
                </button>

                {/* WhatsApp Share Button */}
                <a
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-10 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-semibold rounded-none tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="text-emerald-500 text-base">💬</span>
                  <span>Share via WhatsApp</span>
                </a>
              </div>

              {/* Optional Sandbox Simulation */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={simulating}
                  onClick={handleSimulatePayment}
                  className="text-[10px] font-mono text-gray-400 hover:text-black dark:hover:text-white underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>[Sandbox] Simulasikan Pembayaran Sukses</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── 3. CARD FOOTER ─── */}
        <div className="pt-4 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono text-gray-400 dark:text-zinc-500">
          <Link href="/topup" className="hover:underline">
            &larr; Batalkan / Kembali
          </Link>
          <span>Powered by qriskuu</span>
        </div>
      </div>
    </div>
  );
}

