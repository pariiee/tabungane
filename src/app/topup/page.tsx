"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";

export default function TopUpPage() {
  const searchParams = useSearchParams();
  const initialGrupId = searchParams.get("grup_id") || "wallet";

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState(initialGrupId);
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Payment Active State
  const [activePayment, setActivePayment] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "berhasil" | "expired">("pending");
  const [newBalance, setNewBalance] = useState<number>(0);
  const [simulating, setSimulating] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => res.json())
      .then((data) => {
        const grps = data?.groups || [];
        setGroups(grps);
      });
  }, []);

  useEffect(() => {
    if (activePayment && paymentStatus === "pending") {
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
  }, [activePayment, paymentStatus]);

  useEffect(() => {
    if (activePayment && paymentStatus === "pending") {
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/${activePayment.trxid}/status`);
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
          console.error("Polling status error:", e);
        }
      }, 3000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activePayment, paymentStatus]);

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const finalAmount = customAmount ? parseInt(customAmount, 10) : amount;
    if (isNaN(finalAmount) || finalAmount < 1000 || finalAmount > 1000000) {
      setError("Nominal harus antara Rp 1.000 dan Rp 1.000.000");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup_id: selectedDestination === "wallet" ? null : selectedDestination,
          amount: finalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kode QRIS");

      setActivePayment(data);
      setTimeLeft(300);
      setPaymentStatus("pending");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!activePayment) return;
    setSimulating(true);
    try {
      const res = await fetch(`/api/payments/${activePayment.trxid}/status?simulate_pay=1`);
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
  const nominalPresets = [10000, 25000, 50000, 100000];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          <span>Top Up Saldo QRIS</span>
        </h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          Scan QR menggunakan GoPay, ShopeePay, BCA, Mandiri, atau mobile banking apapun. Tanpa biaya admin.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!activePayment ? (
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs space-y-6">
          <form onSubmit={handleCreateQR} className="space-y-5">
            {/* Tujuan Saldo */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Tujuan Top Up
              </label>
              <select
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              >
                <option value="wallet">Dompet Utama (Saku Pribadi — Bebas Kirim / Alokasi)</option>
                {groups.map((g) => (
                  <option key={g.grup_id} value={g.grup_id}>
                    Event: {g.nama_grup} ({g.nama_kelas} &bull; Target: Rp {g.target_per_mahasiswa.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal Presets */}
            <div>
              <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
                Pilih Nominal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {nominalPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                    className={`h-9 px-3 rounded-lg border text-xs font-medium transition-all ${
                      amount === preset && !customAmount
                        ? "border-black dark:border-white bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100"
                        : "border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    Rp {preset.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-semibold text-gray-400 dark:text-zinc-500">
                  Rp
                </span>
                <input
                  type="number"
                  min={1000}
                  max={1000000}
                  step={1000}
                  placeholder="Atau ketik nominal kustom (1.000 - 1.000.000)"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full h-10 pl-11 pr-4 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1.5">
                Minimal Rp 1.000, maksimal Rp 1.000.000 per transaksi QRIS.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyiapkan QRIS Dinamis...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Lanjut Terbitkan QRIS</span>
                </>
              )}
            </button>
          </form>

          <div className="border-t border-gray-100 dark:border-zinc-800/50 pt-4 flex items-center justify-between text-[11px] text-gray-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Verifikasi otomatis real-time</span>
            </span>
            <span>Gateway qriskuu API</span>
          </div>
        </div>
      ) : (
        /* Active Payment Screen with QR Code */
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-6 sm:p-8 shadow-xs text-center space-y-6">
          {paymentStatus === "pending" && (
            <>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-3 py-1 rounded-full">
                  Menunggu Pembayaran
                </span>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-2">
                  Total Bayar: Rp {activePayment.amount.toLocaleString("id-ID")}
                </h2>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  ID Transaksi: {activePayment.trxid}
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 rounded-full text-xs font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Sisa waktu: {timeFormatted}</span>
              </div>

              {/* QR Image */}
              <div className="flex justify-center my-2">
                <div className="p-4 bg-white border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm inline-block">
                  <img
                    src={activePayment.qr_url}
                    alt="QRIS Top Up"
                    className="w-64 h-64 mx-auto object-contain"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400 dark:text-zinc-500 max-w-sm mx-auto">
                Buka GoPay, ShopeePay, BCA, atau m-Banking Anda, pilih Scan QRIS lalu konfirmasi pembayaran.
              </div>

              {/* Testing / Simulator Action */}
              <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 rounded-xl border border-gray-100 dark:border-zinc-800/60 max-w-sm mx-auto space-y-2">
                <div className="text-[11px] text-gray-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Mode Simulasi Pengujian:</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full h-8 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-xs font-medium transition-colors"
                >
                  {simulating ? "Memproses Bayar..." : "Simulasikan Pembayaran Berhasil"}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setActivePayment(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 underline"
                >
                  Batalkan & Buat Transaksi Baru
                </button>
              </div>
            </>
          )}

          {paymentStatus === "berhasil" && (
            <div className="py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Pembayaran Berhasil!</h2>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  Saldo berhasil ditambahkan sebesar Rp {activePayment.amount.toLocaleString("id-ID")}.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium inline-flex items-center justify-center"
                >
                  Kembali ke Dashboard
                </Link>
                <button
                  onClick={() => setActivePayment(null)}
                  className="h-9 px-4 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 inline-flex items-center justify-center"
                >
                  Top Up Lagi
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="py-6 space-y-4">
              <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">QR Kedaluwarsa</h2>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                  Batas waktu pembayaran 5 menit telah habis. Silakan buat kode QR baru.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePayment(null)}
                className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium inline-flex items-center justify-center shadow-xs"
              >
                Buat QR Baru
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

