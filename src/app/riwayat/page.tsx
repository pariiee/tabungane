"use client";

import { useEffect, useState, useMemo } from "react";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
import { ListRowsSkeleton } from "@/components/Skeletons";
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Layers,
  Wallet,
  RefreshCw,
  QrCode,
  Filter,
} from "lucide-react";

type FilterTab = "all" | "topup" | "event" | "transfer";

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

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

  // Summary Metrics
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

  // Filtered List
  const filteredList = useMemo(() => {
    if (activeTab === "all") return transactions;
    if (activeTab === "topup") return transactions.filter((t) => t.tipe === "topup_qris");
    if (activeTab === "event") return transactions.filter((t) => t.tipe === "alokasi_keluar" || t.tipe === "alokasi_masuk");
    if (activeTab === "transfer") return transactions.filter((t) => t.tipe === "transfer_keluar" || t.tipe === "transfer_masuk");
    return transactions;
  }, [transactions, activeTab]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        <div className="space-y-2 animate-pulse">
          <div className="h-7 w-48 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
          <div className="h-3.5 w-72 bg-gray-100 dark:bg-zinc-800/60 rounded" />
        </div>
        <ListRowsSkeleton count={6} />
      </div>
    );
  }

  const getTrxDetails = (t: any) => {
    const isPositive = t.jumlah > 0;
    switch (t.tipe) {
      case "topup_qris":
        return {
          label: "Top Up QRIS",
          icon: <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          isPositive: true,
        };
      case "transfer_keluar":
        return {
          label: "Transfer Keluar",
          icon: <Send className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          isPositive: false,
        };
      case "transfer_masuk":
        return {
          label: "Transfer Masuk",
          icon: <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          isPositive: true,
        };
      case "alokasi_keluar":
        return {
          label: "Iuran Event Sakune",
          icon: <Layers className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />,
          isPositive: false,
        };
      case "alokasi_masuk":
        return {
          label: "Dana Masuk dari Dompet",
          icon: <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
          isPositive: true,
        };
      case "manual_add":
        return {
          label: "Setoran Kas Tunai",
          icon: <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
          isPositive: true,
        };
      case "reversal":
        return {
          label: "Koreksi Saldo (Reversal)",
          icon: <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          isPositive: false,
        };
      default:
        return {
          label: formatTrxType(t.tipe),
          icon: isPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <RotateCcw className="w-4 h-4 text-rose-600" />,
          isPositive,
        };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2.5">
            <History className="w-6 h-6 text-black dark:text-white" strokeWidth={2} />
            <span>Riwayat Transaksi</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Laporan lengkap mutasi dompet utama, iuran event Sakune, dan transfer antar mahasiswa.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="self-start sm:self-auto h-9 px-3.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Segarkan</span>
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
            Iuran Event Sakune
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
            Kirim saldo sesama NIM
          </span>
        </div>
      </div>

      {/* Filter Tabs Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-800 w-fit text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "all"
              ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
              : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Semua ({transactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("topup")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "topup"
              ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
              : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Top Up QRIS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("event")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "event"
              ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
              : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Event Kas
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("transfer")}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
            activeTab === "transfer"
              ? "bg-white dark:bg-zinc-900 text-black dark:text-white shadow-xs"
              : "text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          Transfer P2P
        </button>
      </div>

      {/* Transactions Container */}
      <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <History className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              Tidak ada transaksi pada kategori ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
            {filteredList.map((t) => {
              const { label, icon, isPositive } = getTrxDetails(t);
              const isSuccess = t.status === "berhasil";

              return (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-zinc-100 text-xs sm:text-sm">
                          {label}
                        </span>
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
                      </div>

                      <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                        <span>{t.nama_grup}</span>
                        <span className="mx-1.5">&bull;</span>
                        <span>
                          {new Date(t.created_at).toLocaleString("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      {t.catatan && (
                        <div className="text-[11px] text-gray-500 dark:text-zinc-400 italic mt-0.5 truncate">
                          {t.catatan}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <div
                      className={`text-sm sm:text-base font-bold font-mono tracking-tight ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-zinc-100"
                      }`}
                    >
                      {isPositive ? "+" : "-"}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                    </div>
                    {t.qris_trx_id && (
                      <span className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 block mt-0.5">
                        {t.qris_trx_id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
