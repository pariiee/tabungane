"use client";

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
  ArrowDownLeft,
  ArrowUpRight,
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
      {/* Header + Filter Pojok Kanan */}
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

        {/* Filter Category di Pojok Kanan */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
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

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Segarkan data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabel Riwayat Transaksi */}
      <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-6">
            <TableRowsSkeleton rows={6} />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Tidak ada catatan transaksi pada filter ini.
            </p>
          </div>
        ) : (
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
                {filteredList.map((t) => {
                  const { label, isPositive } = getCategoryInfo(t);
                  const isSuccess = t.status === "berhasil";

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-zinc-900/40 transition-colors"
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
                        <span
                          className={`font-mono font-bold text-xs sm:text-sm ${
                            isPositive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-900 dark:text-zinc-100"
                          }`}
                        >
                          {isPositive ? "+" : "-"}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                        <span className="font-semibold text-gray-900 dark:text-zinc-100">
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
