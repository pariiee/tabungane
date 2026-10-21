"use client";

import { useEffect, useState, useRef, use } from "react";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

export default function InvoicePage({ params }: { params: Promise<{ trxid: string }> }) {
  const resolvedParams = use(params);
  const trxid = resolvedParams.trxid;

  const [payment, setPayment] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "berhasil" | "expired">("pending");
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load
  useEffect(() => {
    fetch(`/api/payments/${trxid}/status`)
      .then((res) => res.json())
      .then((data) => {
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [trxid]);

  // Countdown timer
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

  // Polling payment status
  useEffect(() => {
    if (paymentStatus === "pending") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/${trxid}/status`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "berhasil") {
              setPaymentStatus("berhasil");
              setNewBalance(data.current_balance);
              if (pollRef.current) clearInterval(pollRef.current);
              if (timerRef.current) clearInterval(timerRef.current);
            } else if (data.status === "expired") {
              setPaymentStatus("expired");
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [trxid, paymentStatus]);

  const handleSimulatePayment = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`/api/payments/${trxid}/status?simulate_pay=1`);
      const data = await res.json();
      if (data.status === "berhasil") {
        setPaymentStatus("berhasil");
        setNewBalance(data.current_balance);
        if (pollRef.current) clearInterval(pollRef.current);
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
        <p className="text-xs text-gray-400">Memuat rincian invoice QRIS...</p>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold">Invoice Tidak Ditemukan</h2>
        <p className="text-xs text-gray-400">{error || "Transaksi tidak valid atau telah dihapus."}</p>
        <Link
          href="/topup"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Top Up</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-6 pb-32">
      <div className="text-center space-y-1">
        <Link
          href="/topup"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-black dark:hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">
          Invoice Pembayaran QRIS
        </h1>
        <p className="text-xs text-gray-400 font-mono">ID: {trxid}</p>
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm text-center space-y-6">
        {paymentStatus === "pending" && (
          <>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-1 rounded-full">
                Menunggu Pembayaran
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-2 font-mono">
                Rp {payment.amount?.toLocaleString("id-ID")}
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                Tujuan: <strong>{payment.nama_grup || "Dompet Pribadi"}</strong>
              </p>
            </div>

            {/* Countdown */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 rounded-full text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Sisa Waktu: <strong className="font-mono">{timeFormatted}</strong></span>
            </div>

            {/* QR Code */}
            <div className="flex justify-center my-3">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-gray-200 inline-block">
                <img
                  src={
                    payment.qr_url ||
                    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                      payment.qr_string || ""
                    )}`
                  }
                  alt="QRIS Dinamis"
                  className="w-56 h-56 object-contain"
                />
                <div className="mt-2 text-center text-[10px] text-gray-400 font-mono tracking-wider">
                  NMID: ID1020021155858
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xs mx-auto">
              Buka GoPay, OVO, Dana, BCA Mobile, atau mobile banking apapun, lalu scan kode QR di atas.
            </p>

            {/* Sandbox Simulation */}
            <div className="pt-2">
              <button
                type="button"
                disabled={simulating}
                onClick={handleSimulatePayment}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>[Sandbox] Simulasikan Pembayaran Sukses</span>
              </button>
            </div>
          </>
        )}

        {paymentStatus === "berhasil" && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                Pembayaran Berhasil!
              </h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Saldo sebesar <strong className="text-black dark:text-white font-mono">Rp {payment.amount?.toLocaleString("id-ID")}</strong> telah masuk.
              </p>
              {newBalance !== null && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  Saldo Akun Anda: Rp {newBalance.toLocaleString("id-ID")}
                </p>
              )}
            </div>

            <div className="pt-3">
              <Link
                href="/dashboard"
                className="h-10 px-6 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl text-xs font-semibold inline-flex items-center justify-center shadow-xs"
              >
                Kembali ke Dashboard
              </Link>
            </div>
          </div>
        )}

        {paymentStatus === "expired" && (
          <div className="py-8 space-y-4">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                QRIS Kedaluwarsa
              </h2>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                Waktu 5 menit telah habis. Silakan buat transaksi baru.
              </p>
            </div>

            <div className="pt-3">
              <Link
                href="/topup"
                className="h-10 px-6 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl text-xs font-semibold inline-flex items-center justify-center shadow-xs"
              >
                Buat QRIS Baru
              </Link>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-zinc-800/50 pt-4 flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verifikasi otomatis real-time</span>
          </span>
          <span>Gateway qriskuu API</span>
        </div>
      </div>
    </div>
  );
}
