"use client";

import { useEffect, useState, useRef, useTransition } from "react";
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
  Zap
} from "lucide-react";

export default function TopUpPage() {
  const searchParams = useSearchParams();
  const initialGrupId = searchParams.get("grup_id") || "";

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGrup, setSelectedGrup] = useState(initialGrupId);
  const [amount, setAmount] = useState<number>(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Payment Active State
  const [activePayment, setActivePayment] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes (300s)
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "berhasil" | "expired">("pending");
  const [newBalance, setNewBalance] = useState<number>(0);
  const [simulating, setSimulating] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load groups
  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => res.json())
      .then((data) => {
        const grps = data?.groups || [];
        setGroups(grps);
        if (!selectedGrup && grps.length > 0) {
          setSelectedGrup(grps[0].grup_id);
        }
      });
  }, []);

  // Timer countdown
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

  // Polling every 3 seconds to our server (PRD rule 6.1)
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
      setError("Nominal harus antara Rp1.000 dan Rp1.000.000");
      return;
    }
    if (!selectedGrup) {
      setError("Pilih grup tabungan terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup_id: selectedGrup,
          amount: finalAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kode QR");

      setActivePayment(data);
      setTimeLeft(300);
      setPaymentStatus("pending");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simulate payment (useful for testing without waiting for live webhook)
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-emerald-600" />
          Top Up Tabungan QRIS
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan QR menggunakan GoPay, ShopeePay, BCA, atau mobile banking apapun. Tanpa biaya admin.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!activePayment ? (
        /* Top Up Form */
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-6">
          <form onSubmit={handleCreateQR} className="space-y-5">
            {/* Pilih Grup */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Pilih Grup Tabungan
              </label>
              <select
                value={selectedGrup}
                onChange={(e) => setSelectedGrup(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              >
                {groups.map((g) => (
                  <option key={g.grup_id} value={g.grup_id}>
                    {g.nama_grup} (Target: Rp{g.target_per_mahasiswa.toLocaleString("id-ID")})
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal Presets */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
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
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      amount === preset && !customAmount
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Rp{preset.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-semibold text-gray-400">
                  Rp
                </span>
                <input
                  type="number"
                  min={1000}
                  max={1000000}
                  step={1000}
                  placeholder="Atau ketik nominal lain (1.000 - 1.000.000)"
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                  }}
                  className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Minimal Rp1.000, maksimal Rp1.000.000 per transaksi QRIS.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || groups.length === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Menyiapkan QRIS...
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  Lanjut Bayar QRIS
                </>
              )}
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sistem verifikasi otomatis
            </span>
            <span>Didukung oleh API qriskuu</span>
          </div>
        </div>
      ) : (
        /* Active Payment Screen with QR Code */
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm text-center space-y-6">
          {paymentStatus === "pending" && (
            <>
              <div>
                <span className="text-xs uppercase font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                  Menunggu Pembayaran
                </span>
                <h2 className="text-xl font-bold text-gray-900 mt-2">
                  Total Bayar: Rp{activePayment.amount.toLocaleString("id-ID")}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">ID Transaksi: {activePayment.trxid}</p>
              </div>

              {/* Countdown Timer */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                Sisa waktu: {timeFormatted}
              </div>

              {/* QR Image */}
              <div className="flex justify-center my-2">
                <div className="p-4 bg-white border-2 border-emerald-500 rounded-2xl shadow-sm inline-block">
                  <img
                    src={activePayment.qr_url}
                    alt="QRIS Top Up"
                    className="w-64 h-64 mx-auto object-contain"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 max-w-sm mx-auto">
                Buka GoPay, ShopeePay, BCA, atau m-Banking Anda, pilih Scan QRIS lalu konfirmasi pembayaran.
              </div>

              {/* Testing / Simulator Action */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 max-w-sm mx-auto space-y-2">
                <div className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Mode Dev / Sandbox Testing:
                </div>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={simulating}
                  className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  {simulating ? "Memproses Bayar..." : "Simulasikan Pembayaran Berhasil"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActivePayment(null)}
                className="text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Batalkan & Buat Transaksi Baru
              </button>
            </>
          )}

          {paymentStatus === "berhasil" && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Pembayaran Berhasil!</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Saldo Anda telah berhasil ditambahkan sebesar Rp
                  {activePayment.amount.toLocaleString("id-ID")}.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl max-w-xs mx-auto text-emerald-800 text-sm font-semibold">
                Total Saldo Anda di Grup Ini:
                <div className="text-xl font-bold mt-1">
                  Rp{newBalance.toLocaleString("id-ID")}
                </div>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <Link
                  href="/dashboard"
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  Kembali ke Dashboard
                </Link>
                <button
                  onClick={() => setActivePayment(null)}
                  className="py-2.5 px-4 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Top Up Lagi
                </button>
              </div>
            </div>
          )}

          {paymentStatus === "expired" && (
            <div className="py-6 space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">QR Kedaluwarsa</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Batas waktu pembayaran 5 menit telah habis. Silakan buat kode QR baru.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActivePayment(null)}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm"
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
