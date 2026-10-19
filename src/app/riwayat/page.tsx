"use client";

import { useEffect, useState } from "react";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
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
  RefreshCw
} from "lucide-react";

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
          Memuat riwayat transaksi...
        </div>
      </div>
    );
  }

  const getTrxDetails = (t: any) => {
    const isPositive = t.jumlah > 0;
    switch (t.tipe) {
      case "topup_qris":
        return {
          label: "Top Up QRIS",
          icon: <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case "transfer_keluar":
        return {
          label: "Transfer Keluar (P2P NIM)",
          icon: <Send className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        };
      case "transfer_masuk":
        return {
          label: "Transfer Masuk (P2P NIM)",
          icon: <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case "alokasi_keluar":
        return {
          label: "Alokasi ke Event Sakune",
          icon: <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
        };
      case "alokasi_masuk":
        return {
          label: "Dana Masuk dari Dompet",
          icon: <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
        };
      case "manual_add":
        return {
          label: "Setor Tunai (Admin)",
          icon: <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
        };
      case "reversal":
        return {
          label: "Koreksi Saldo (Reversal)",
          icon: <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
        };
      default:
        return {
          label: formatTrxType(t.tipe),
          icon: isPositive ? <ArrowUpRight className="w-4 h-4 text-emerald-600" /> : <RotateCcw className="w-4 h-4 text-rose-600" />,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Riwayat Transaksi Saya</span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Semua catatan mutasi dompet utama, setoran event Sakune, dan transfer antar NIM.
          </p>
        </div>

        <div>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Transactions Container */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400 dark:text-zinc-500">
            Belum ada catatan mutasi transaksi saat ini.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
            {transactions.map((t) => {
              const isPositive = t.jumlah > 0;
              const isSuccess = t.status === "berhasil";
              const { label, icon } = getTrxDetails(t);

              return (
                <div
                  key={t.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-gray-900 dark:text-zinc-100 text-xs">
                        {label}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                        {t.nama_grup} &bull; {new Date(t.created_at).toLocaleString("id-ID")}
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
                      className={`text-xs sm:text-sm font-bold tracking-tight ${
                        isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
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
