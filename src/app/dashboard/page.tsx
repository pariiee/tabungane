"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  QrCode,
  Send,
  Layers,
  Users,
  Trophy,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  RefreshCw
} from "lucide-react";

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [targetNim, setTargetNim] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [selectedGrupId, setSelectedGrupId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [allocNote, setAllocNote] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/student/dashboard");
      const d = await res.json();
      setData(d);
      if (d.groups?.length > 0 && !selectedGrupId) {
        setSelectedGrupId(d.groups[0].grup_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg(null);
    try {
      const res = await fetch("/api/student/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_nim: targetNim,
          amount: parseInt(transferAmount, 10),
          catatan: transferNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Transfer gagal");

      setModalMsg({ type: "success", text: `Berhasil transfer Rp ${parseInt(transferAmount, 10).toLocaleString("id-ID")} ke ${resData.target_nama} (${targetNim})!` });
      setTargetNim("");
      setTransferAmount("");
      setTransferNote("");
      loadData();
      setTimeout(() => {
        setShowTransferModal(false);
        setModalMsg(null);
      }, 1500);
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg(null);
    try {
      const res = await fetch("/api/student/wallet/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup_id: selectedGrupId,
          amount: parseInt(allocAmount, 10),
          catatan: allocNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Alokasi gagal");

      setModalMsg({ type: "success", text: `Berhasil alokasikan Rp ${parseInt(allocAmount, 10).toLocaleString("id-ID")} ke kas kelas!` });
      setAllocAmount("");
      setAllocNote("");
      loadData();
      setTimeout(() => {
        setShowAllocModal(false);
        setModalMsg(null);
      }, 1500);
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
          Memuat data dompet & tabungan...
        </div>
      </div>
    );
  }

  const user = data?.user;
  const saldoDompet = data?.saldo_dompet || 0;
  const totalTabungan = data?.total_tabungan || 0;
  const groups = data?.groups || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
              NIM: {user?.nim}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
            Halo, {user?.nama} 👋
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Kelola saldo saku pribadi, kirim sesama mahasiswa, dan alokasikan ke kas kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/topup"
            className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors inline-flex items-center gap-2 shadow-xs active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Top Up Saku</span>
          </Link>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Dompet Utama (Saku) */}
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
              <span>Dompet Utama (Saku)</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-2">
              Rp {saldoDompet.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Saldo bebas untuk transfer atau kas
            </p>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Send className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Transfer NIM</span>
            </button>
            <button
              onClick={() => setShowAllocModal(true)}
              className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3 h-3 text-teal-600 dark:text-teal-400" />
              <span>Alokasi Kas</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total di Kas Kelas */}
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
              <span>Total di Kas Grup</span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-2">
              Rp {totalTabungan.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              Akumulasi setoran di seluruh grup kelas
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
            <span>Grup Diikuti</span>
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{groups.length} Grup</span>
          </div>
        </div>

        {/* Card 3: Gateway QRIS Otomatis */}
        <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-gray-400 dark:text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
              <span>Metode Pembayaran</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <QrCode className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-2 flex items-center gap-2">
              <span>QRIS Dynamic</span>
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 rounded-full font-medium">
                Zero Fee
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
              GoPay, ShopeePay, BCA, Mandiri, BRI dll
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
            <Link
              href="/riwayat"
              className="text-xs font-medium text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <span>Lihat Riwayat Mutasi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Kantong Kas & Tabungan Kelas</span>
            </h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Pilih grup untuk melihat leaderboard dan progres kas kelas.
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-8 text-center text-xs text-gray-400 dark:text-zinc-500 shadow-xs">
            Belum ada grup tabungan aktif untuk kelas Anda saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g: any) => {
              const progressCapped = Math.min(g.progress_pct, 100);
              return (
                <div
                  key={g.grup_id}
                  className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs hover:border-gray-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 rounded-full">
                        Kelas {g.nama_kelas}
                      </span>
                      <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm mt-2">{g.nama_grup}</h3>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 border ${
                        g.is_lewat_deadline
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {g.is_lewat_deadline ? "Berakhir" : `${g.sisa_hari} hari lagi`}
                    </span>
                  </div>

                  {/* Saldo vs Target */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">Saldo Saya di Kas</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Rp {g.saldo_saya.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">Target Iuran</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-0.5">
                        Rp {g.target_per_mahasiswa.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                      <span>Progres Iuran</span>
                      <span className="font-bold text-gray-900 dark:text-zinc-100">{g.progress_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressCapped}%` }}
                      />
                    </div>
                  </div>

                  {/* Total Collected */}
                  <div className="text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50/80 dark:bg-zinc-900/60 p-2.5 rounded-lg flex justify-between items-center border border-gray-100 dark:border-zinc-800/60">
                    <span>Total Kas Terkumpul:</span>
                    <span className="font-bold text-gray-900 dark:text-zinc-100">
                      Rp {g.total_terkumpul_grup.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/grup/${g.grup_id}`}
                      className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Leaderboard</span>
                    </Link>
                    <Link
                      href={`/topup?grup_id=${g.grup_id}`}
                      className="flex-1 h-8 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-[11px] font-medium transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Bayar Kas</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Transfer P2P NIM */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  Transfer Saldo ke Mahasiswa
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Saldo saku Anda: Rp {saldoDompet.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setModalMsg(null);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {modalMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  NIM Penerima
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 240001"
                  value={targetNim}
                  onChange={(e) => setTargetNim(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={saldoDompet}
                  required
                  placeholder="Minimal Rp 1.000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Uang print tugas / patungan"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || saldoDompet <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Alokasi ke Kas Kelas */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  Alokasi Dana ke Kas Kelas
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Saldo saku Anda: Rp {saldoDompet.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllocModal(false);
                  setModalMsg(null);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {modalMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Pilih Grup Kas Tujuan
                </label>
                <select
                  value={selectedGrupId}
                  onChange={(e) => setSelectedGrupId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  {groups.map((g: any) => (
                    <option key={g.grup_id} value={g.grup_id}>
                      {g.nama_grup} (Target: Rp {g.target_per_mahasiswa.toLocaleString("id-ID")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nominal Alokasi (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={saldoDompet}
                  required
                  placeholder="Jumlah yang ingin dialokasikan"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Iuran minggu ke-3"
                  value={allocNote}
                  onChange={(e) => setAllocNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || saldoDompet <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Alokasikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

