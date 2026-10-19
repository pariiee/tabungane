"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  QrCode,
  Calendar,
  Users,
  Trophy,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock
} from "lucide-react";

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-gray-500 animate-pulse">Memuat data dashboard...</div>
      </div>
    );
  }

  const user = data?.user;
  const groups = data?.groups || [];
  const totalTabungan = data?.total_tabungan || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-semibold tracking-wider text-emerald-200">
            NIM: {user?.nim}
          </span>
          <h1 className="text-2xl font-bold mt-1">Halo, {user?.nama} 👋</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Pantau tabungan kelas dan bayar kas dengan mudah lewat QRIS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/topup"
            className="flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Top Up Sekarang
          </Link>
        </div>
      </div>

      {/* Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Total Tabungan Saya</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            Rp{totalTabungan.toLocaleString("id-ID")}
          </div>
          <div className="text-xs text-gray-400 mt-1">Akumulasi dari semua grup aktif</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Grup Diikuti</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{groups.length}</div>
          <div className="text-xs text-gray-400 mt-1">Grup tabungan & kas terdaftar</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-semibold uppercase">
            <span>Metode Bayar</span>
            <QrCode className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-base font-bold text-gray-900 mt-2 flex items-center gap-1.5">
            <span>QRIS Otomatis</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Tanpa Biaya</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">GoPay, ShopeePay, BCA, Mandiri dll</div>
        </div>
      </div>

      {/* Groups List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Grup Tabungan Kelas
          </h2>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-gray-200 text-center text-gray-500">
            Belum ada grup tabungan aktif untuk kelas Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g: any) => {
              const progressCapped = Math.min(g.progress_pct, 100);
              return (
                <div
                  key={g.grup_id}
                  className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-200 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        Kelas {g.nama_kelas}
                      </span>
                      <h3 className="font-bold text-gray-900 text-base mt-2">{g.nama_grup}</h3>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        g.is_lewat_deadline
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {g.is_lewat_deadline ? "Berakhir" : `${g.sisa_hari} hari lagi`}
                    </span>
                  </div>

                  {/* Saldo vs Target */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Saldo Saya</div>
                      <div className="text-lg font-bold text-emerald-600">
                        Rp{g.saldo_saya.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Target Nominal</div>
                      <div className="text-sm font-semibold text-gray-700">
                        Rp{g.target_per_mahasiswa.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Progres Saya</span>
                      <span className="font-bold text-gray-800">{g.progress_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          g.progress_pct >= 100 ? "bg-emerald-500" : "bg-teal-500"
                        }`}
                        style={{ width: `${progressCapped}%` }}
                      />
                    </div>
                  </div>

                  {/* Group Total Collected */}
                  <div className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg flex justify-between items-center">
                    <span>Total Dana Terkumpul Grup:</span>
                    <span className="font-bold text-gray-800">
                      Rp{g.total_terkumpul_grup.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/grup/${g.grup_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      Leaderboard
                    </Link>
                    <Link
                      href={`/topup?grup_id=${g.grup_id}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Top Up
                    </Link>
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
