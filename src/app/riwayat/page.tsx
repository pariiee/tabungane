"use client";

import { useEffect, useState } from "react";
import { History, ArrowUpRight, ArrowDownLeft, RotateCcw, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function RiwayatPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/riwayat")
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data?.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-gray-500 animate-pulse">Memuat riwayat transaksi...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-6 h-6 text-emerald-600" />
          Riwayat Tabungan Saya
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Catatan mutasi setoran QRIS, setoran tunai, dan penyesuaian saldo.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">
            Belum ada riwayat transaksi.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t) => {
              const isPositive = t.jumlah > 0;
              const isSuccess = t.status === "berhasil";

              let icon = <ArrowUpRight className="w-5 h-5 text-emerald-600" />;
              if (t.tipe === "reversal" || !isPositive) {
                icon = <RotateCcw className="w-5 h-5 text-red-600" />;
              } else if (t.tipe === "manual_add") {
                icon = <ArrowDownLeft className="w-5 h-5 text-blue-600" />;
              }

              return (
                <div key={t.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      {icon}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {t.tipe === "topup_qris"
                          ? "Top Up QRIS"
                          : t.tipe === "manual_add"
                          ? "Setoran Tunai (Admin)"
                          : "Koreksi Saldo"}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {t.nama_grup} &bull; {new Date(t.created_at).toLocaleString("id-ID")}
                      </div>
                      {t.catatan && (
                        <div className="text-xs text-gray-500 italic mt-0.5">{t.catatan}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm sm:text-base font-bold ${
                        isPositive ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}Rp{t.jumlah.toLocaleString("id-ID")}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                        isSuccess
                          ? "bg-emerald-50 text-emerald-700"
                          : t.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : t.status === "pending" ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <AlertCircle className="w-3 h-3" />
                      )}
                      {t.status}
                    </span>
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
