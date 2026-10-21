"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
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
  Sparkles,
  Check,
  Layers,
  Info,
} from "lucide-react";

export default function TopUpPage() {
  const searchParams = useSearchParams();
  const initialGrupId = searchParams.get("grup_id") || "wallet";

  const [groups, setGroups] = useState<any[]>([]);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
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

  const loadHistory = () => {
    fetch("/api/student/riwayat?tipe=topup&limit=5")
      .then((res) => res.json())
      .then((d) => setTopupHistory(d.data || []));
  };

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => res.json())
      .then((data) => {
        const grps = data?.groups || [];
        setGroups(grps);
      });
    loadHistory();
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
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
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

      {/* Grid 2 Kolom di Desktop (Formulir di Kiri, Riwayat di Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Form Topup / Layar Pembayaran QRIS */}
        <div className="lg:col-span-7 space-y-6">

      {!activePayment ? (
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs space-y-6">
          <form onSubmit={handleCreateQR} className="space-y-5">
            {/* Pilihan Tujuan Top Up: Segmented Visual Cards (Bukan Dropdown) */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Tujuan Top Up
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opsi 1: Dompet Utama */}
                <button
                  type="button"
                  onClick={() => setSelectedDestination("wallet")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                    selectedDestination === "wallet"
                      ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800/80 ring-1 ring-black dark:ring-white shadow-xs"
                      : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 ${
                      selectedDestination === "wallet"
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                        Dompet Utama
                      </span>
                      {selectedDestination === "wallet" && (
                        <span className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-snug">
                      Saku pribadi &bull; Bebas transfer / alokasi
                    </p>
                  </div>
                </button>

                {/* Opsi 2+: Event Sakune */}
                {groups.map((g) => {
                  const isSelected = selectedDestination === g.grup_id;
                  return (
                    <button
                      key={g.grup_id}
                      type="button"
                      onClick={() => setSelectedDestination(g.grup_id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800/80 ring-1 ring-black dark:ring-white shadow-xs"
                          : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                            {g.nama_grup}
                          </span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 leading-snug truncate">
                          {g.nama_kelas} &bull; Target Rp {g.target_per_mahasiswa.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
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
      </div>

      {/* Kolom Kanan: Card Riwayat Top Up Terakhir & Panduan (Side-by-Side di Desktop) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-black dark:text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                Riwayat Top Up QRIS
              </h3>
            </div>
            {topupHistory.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                {topupHistory.length} Terakhir
              </span>
            )}
          </div>

          {topupHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
              Belum ada riwayat top up QRIS.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {topupHistory.map((trx) => {
                const isBerhasil = trx.status === "berhasil";
                const isPending = trx.status === "pending";
                const cleanDate = new Date(trx.created_at).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <div key={trx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black dark:text-white font-mono">
                          +Rp {trx.jumlah.toLocaleString("id-ID")}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                            isBerhasil
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : isPending
                              ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                              : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {trx.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate mt-0.5">
                        {cleanDate} &bull; {trx.qris_trx_id || trx.id.slice(0, 8)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                        {trx.nama_grup || "Dompet"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tips / Info QRIS Box */}
        <div className="bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 rounded-2xl p-4 text-xs text-gray-500 dark:text-zinc-400 space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-zinc-100 text-[11px] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5" />
            <span>Petunjuk Pembayaran QRIS</span>
          </div>
          <ul className="text-[11px] text-gray-400 dark:text-zinc-500 space-y-1 list-disc list-inside leading-relaxed">
            <li>QR dinamis berlaku selama 15 menit sejak diterbitkan.</li>
            <li>Saldo otomatis bertambah saat itu juga setelah transfer sukses.</li>
            <li>Mendukung semua e-wallet (GoPay, OVO, ShopeePay) & M-Banking.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);
}

