"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { formatTrxStatus } from "@/lib/format";
import { TableRowsSkeleton } from "@/components/Skeletons";
import CustomSelect from "@/components/CustomSelect";
import {
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  X,
  Copy,
  Check,
  Receipt,
  QrCode,
  Send,
  Layers,
  Wallet,
  RotateCcw,
} from "lucide-react";

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/student/riwayat");
      const data = await res.json();
      setTransactions(data?.data || []);
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

  // Summary Metrics (3 Cards)
  const stats = useMemo(() => {
    let totalMasuk = 0;
    let totalEvent = 0;
    let totalTransfer = 0;

    transactions.forEach((t) => {
      if (t.status === "berhasil") {
        if (t.tipe === "topup_qris" || t.tipe === "transfer_masuk" || t.tipe === "manual_add") {
          totalMasuk += Math.abs(t.jumlah);
        } else if (t.tipe === "alokasi_keluar") {
          totalEvent += Math.abs(t.jumlah);
        } else if (t.tipe === "transfer_keluar") {
          totalTransfer += Math.abs(t.jumlah);
        }
      }
    });

    return { totalMasuk, totalEvent, totalTransfer };
  }, [transactions]);

  const getCategoryInfo = (t: any) => {
    switch (t.tipe) {
      case "topup_qris":
        return { label: "Top Up QRIS", isPositive: true };
      case "transfer_keluar":
        return { label: "Transfer Keluar", isPositive: false };
      case "transfer_masuk":
        return { label: "Transfer Masuk", isPositive: true };
      case "alokasi_keluar":
        return { label: "Iuran Event Kas", isPositive: false };
      case "alokasi_masuk":
        return { label: "Dana Masuk Event", isPositive: true };
      case "manual_add":
        return { label: "Setoran Kas Tunai", isPositive: true };
      case "reversal":
        return { label: "Koreksi Saldo", isPositive: false };
      default:
        return { label: t.tipe || "Transaksi", isPositive: t.jumlah > 0 };
    }
  };

  const filteredList = useMemo(() => {
    if (filterCategory === "all") return transactions;
    if (filterCategory === "topup") return transactions.filter((t) => t.tipe === "topup_qris");
    if (filterCategory === "event") return transactions.filter((t) => t.tipe === "alokasi_keluar" || t.tipe === "alokasi_masuk");
    if (filterCategory === "transfer") return transactions.filter((t) => t.tipe === "transfer_keluar" || t.tipe === "transfer_masuk");
    return transactions;
  }, [transactions, filterCategory]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-6 h-6 text-black dark:text-white" strokeWidth={2} />
            <span>Riwayat Transaksi</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Semua catatan mutasi dompet utama, iuran event kelas, dan transfer antar mahasiswa.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto h-9 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          title="Segarkan data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 3 Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
            Total Dana Masuk
          </span>
          <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            +Rp {stats.totalMasuk.toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 block">
            Top Up QRIS & Transfer Masuk
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
            Iuran Event Kas
          </span>
          <p className="text-lg font-bold font-mono text-gray-900 dark:text-zinc-100 mt-1">
            Rp {stats.totalEvent.toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 block">
            Alokasi kas kelas & kegiatan
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113] shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
            Transfer Keluar
          </span>
          <p className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
            -Rp {stats.totalTransfer.toLocaleString("id-ID")}
          </p>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5 block">
            Kirim saldo antar ID akun
          </span>
        </div>
      </div>

      {/* Baris Filter Pojok Kanan di Atas Tabel */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
          Daftar Mutasi ({filteredList.length})
        </span>

        <div className="w-44">
          <CustomSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={[
              { value: "all", label: "Semua Kategori" },
              { value: "topup", label: "Top Up QRIS" },
              { value: "event", label: "Iuran Event Kas" },
              { value: "transfer", label: "Transfer P2P" },
            ]}
          />
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-900/50 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                <th className="py-3 px-4 sm:px-5">Tanggal</th>
                <th className="py-3 px-4 sm:px-5">Jumlah</th>
                <th className="py-3 px-4 sm:px-5">Category</th>
                <th className="py-3 px-4 sm:px-5">Status</th>
                <th className="py-3 px-4 sm:px-5">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60 text-gray-700 dark:text-zinc-300">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={5} />
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500">
                    <History className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" />
                    <span>Tidak ada catatan transaksi pada filter ini.</span>
                  </td>
                </tr>
              ) : (
                filteredList.map((t) => {
                  const { label, isPositive } = getCategoryInfo(t);
                  const isSuccess = t.status === "berhasil";

                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTrx(t)}
                      className="hover:bg-gray-50/60 dark:hover:bg-zinc-900/40 transition-colors cursor-pointer group"
                    >
                      {/* Tanggal */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap text-gray-500 dark:text-zinc-400 font-mono text-[11px]">
                        {new Date(t.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Jumlah */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        {t.status === "berhasil" ? (
                          <span
                            className={`font-mono font-bold text-xs sm:text-sm ${
                              isPositive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-900 dark:text-zinc-100"
                            }`}
                          >
                            {isPositive ? "+" : "-"}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="font-mono font-medium text-xs sm:text-sm text-gray-400 dark:text-zinc-500">
                            Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-zinc-100 group-hover:underline">
                          {label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isSuccess
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                              : t.status === "pending"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-2.5 h-2.5" />
                          ) : t.status === "pending" ? (
                            <Clock className="w-2.5 h-2.5" />
                          ) : (
                            <AlertCircle className="w-2.5 h-2.5" />
                          )}
                          <span>{formatTrxStatus(t.status)}</span>
                        </span>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3.5 px-4 sm:px-5">
                        <div className="min-w-0 max-w-xs truncate">
                          <span className="text-gray-900 dark:text-zinc-200 font-medium">
                            {t.nama_grup || "Dompet"}
                          </span>
                          {t.catatan && (
                            <span className="text-gray-400 dark:text-zinc-500 ml-1.5 italic text-[11px]">
                              ({t.catatan})
                            </span>
                          )}
                          {t.qris_trx_id && (
                            <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 block">
                              QRIS ID: {t.qris_trx_id}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Transaksi */}
      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-black dark:text-white" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  Rincian Transaksi
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nominal & Status Highlight */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800 text-center space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-zinc-500">
                {getCategoryInfo(selectedTrx).label}
              </span>
              <div
                className={`text-2xl font-bold font-mono tracking-tight ${
                  getCategoryInfo(selectedTrx).isPositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-gray-900 dark:text-zinc-100"
                }`}
              >
                {getCategoryInfo(selectedTrx).isPositive ? "+" : "-"}Rp {Math.abs(selectedTrx.jumlah).toLocaleString("id-ID")}
              </div>
              <div>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    selectedTrx.status === "berhasil"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                      : selectedTrx.status === "pending"
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30"
                  }`}
                >
                  {selectedTrx.status === "berhasil" ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : selectedTrx.status === "pending" ? (
                    <Clock className="w-2.5 h-2.5" />
                  ) : (
                    <AlertCircle className="w-2.5 h-2.5" />
                  )}
                  <span>{formatTrxStatus(selectedTrx.status)}</span>
                </span>
              </div>
            </div>

            {/* Grid Detail Item */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50">
                <span className="text-gray-500 dark:text-zinc-400">Waktu Transaksi</span>
                <span className="font-mono text-gray-900 dark:text-zinc-200 font-medium">
                  {new Date(selectedTrx.created_at).toLocaleString("id-ID", {
                    dateStyle: "full",
                    timeStyle: "medium",
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50">
                <span className="text-gray-500 dark:text-zinc-400">Tujuan / Event</span>
                <span className="font-medium text-gray-900 dark:text-zinc-200">
                  {selectedTrx.nama_grup || "Dompet Utama"}
                </span>
              </div>

              {selectedTrx.catatan && (
                <div className="flex items-start justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50 gap-4">
                  <span className="text-gray-500 dark:text-zinc-400 shrink-0">Catatan</span>
                  <span className="text-right text-gray-900 dark:text-zinc-200 italic">
                    {selectedTrx.catatan}
                  </span>
                </div>
              )}

              {selectedTrx.qris_trx_id && (
                <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50">
                  <span className="text-gray-500 dark:text-zinc-400">ID QRIS Gateway</span>
                  <span className="font-mono text-[11px] text-gray-900 dark:text-zinc-200">
                    {selectedTrx.qris_trx_id}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-zinc-800/50">
                <span className="text-gray-500 dark:text-zinc-400">ID Transaksi</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-700 dark:text-zinc-300">
                  <span>{selectedTrx.id}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTrx.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="p-1 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                    title="Salin ID"
                  >
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="w-full h-10 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
