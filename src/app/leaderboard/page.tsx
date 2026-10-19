"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Medal,
  Wallet,
  ArrowDownLeft,
  Flame,
  QrCode,
  RefreshCw,
  EyeOff,
  UserCheck
} from "lucide-react";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"saldo" | "topup" | "rajin">("saldo");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (activeTab = tab, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/leaderboard?tab=${activeTab}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  const top3 = leaderboard.slice(0, 3);

  const tabs = [
    {
      id: "saldo",
      label: "Top 10 Saldo Terbanyak",
      desc: "Akumulasi saldo dompet utama & seluruh event",
      icon: Wallet,
    },
    {
      id: "topup",
      label: "Top 10 Top Up Terbanyak",
      desc: "Total setoran & top up QRIS lunas",
      icon: ArrowDownLeft,
    },
    {
      id: "rajin",
      label: "Top 10 Paling Rajin",
      desc: "Frekuensi transaksi & konsistensi menabung",
      icon: Flame,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Leaderboard Mahasiswa</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white mt-1">
            Peringkat &amp; Transparansi
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Peringkat capaian tabungan mahasiswa. Saldo nominal hanya tampil jika pemilik akun mengaktifkan izin di profil.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(tab, true)}
            disabled={refreshing}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/topup"
            className="h-9 px-3.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Top Up Saku</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;

          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id as any);
                setLoading(true);
              }}
              className={`p-3.5 rounded-lg border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isActive ? "text-white dark:text-black" : "text-gray-500 dark:text-zinc-400"}`} />
                <span className="text-xs font-bold">{t.label}</span>
              </div>
              <p className={`text-[11px] mt-1 truncate ${isActive ? "text-gray-300 dark:text-zinc-600" : "text-gray-400 dark:text-zinc-500"}`}>
                {t.desc}
              </p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
            Memuat peringkat...
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Podium Card */}
          {top3.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Rank 2 */}
              <div className="order-2 sm:order-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs text-center flex flex-col justify-between">
                <div>
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 flex items-center justify-center">
                      <Medal className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
                    PERINGKAT 2
                  </span>
                  <h3 className="font-bold text-black dark:text-white text-sm mt-1 truncate">
                    {top3[1].nama}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {top3[1].nim} &bull; {top3[1].nama_kelas}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-lg font-bold text-black dark:text-white">
                    {top3[1].display_value !== null ? top3[1].display_value : "•••••••"}
                  </div>
                  {top3[1].display_value === null && (
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Nominal Disembunyikan
                    </div>
                  )}
                </div>
              </div>

              {/* Rank 1 */}
              <div className="order-1 sm:order-2 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white rounded-lg p-5 shadow-xs text-center flex flex-col justify-between relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black text-[10px] font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                  PERINGKAT 1
                </span>
                <div>
                  <div className="flex justify-center mb-2 mt-1">
                    <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                      <Crown className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-extrabold text-black dark:text-white text-base truncate">
                    {top3[0].nama}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    {top3[0].nim} &bull; {top3[0].nama_kelas}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-xl font-extrabold text-black dark:text-white">
                    {top3[0].display_value !== null ? top3[0].display_value : "•••••••"}
                  </div>
                  {top3[0].display_value === null && (
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Nominal Disembunyikan
                    </div>
                  )}
                </div>
              </div>

              {/* Rank 3 */}
              <div className="order-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs text-center flex flex-col justify-between">
                <div>
                  <div className="flex justify-center mb-2">
                    <div className="w-10 h-10 rounded-full bg-amber-50/50 dark:bg-zinc-800 text-amber-700 dark:text-amber-500 flex items-center justify-center">
                      <Medal className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
                    PERINGKAT 3
                  </span>
                  <h3 className="font-bold text-black dark:text-white text-sm mt-1 truncate">
                    {top3[2].nama}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {top3[2].nim} &bull; {top3[2].nama_kelas}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800">
                  <div className="text-lg font-bold text-black dark:text-white">
                    {top3[2].display_value !== null ? top3[2].display_value : "•••••••"}
                  </div>
                  {top3[2].display_value === null && (
                    <div className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Nominal Disembunyikan
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table Leaderboard */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-semibold border-b border-gray-100 dark:border-zinc-800">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">RANK</th>
                    <th className="py-3 px-4">MAHASISWA</th>
                    <th className="py-3 px-4">KELAS</th>
                    <th className="py-3 px-4">RASIO</th>
                    <th className="py-3 px-4 text-right">
                      {tab === "rajin" ? "FREKUENSI TRANSAKSI" : "NOMINAL"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                        Belum ada data transaksi yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((m) => {
                      const isTop1 = m.rank === 1;
                      const isTop2 = m.rank === 2;
                      const isTop3 = m.rank === 3;

                      return (
                        <tr
                          key={m.user_id}
                          className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                            m.is_me ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-medium" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-bold">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <Crown className="w-3.5 h-3.5" />
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400">
                                <Medal className="w-3.5 h-3.5" />
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 dark:bg-zinc-800 text-amber-700 dark:text-amber-500">
                                <Medal className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-500 font-mono">
                                #{m.rank}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-black dark:text-white">
                                {m.nama}
                              </span>
                              {m.is_me && (
                                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                  <UserCheck className="w-2.5 h-2.5" />
                                  <span>Saya</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">
                              {m.nim}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400">
                            {m.nama_kelas}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                                  style={{ width: `${m.progress_pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono w-8 text-right">
                                {m.progress_pct}%
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            {m.display_value !== null ? (
                              <span className="text-black dark:text-white">
                                {m.display_value}
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-zinc-500 text-[11px] inline-flex items-center gap-1 font-sans font-normal">
                                <EyeOff className="w-3 h-3" />
                                <span>•••••••</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
