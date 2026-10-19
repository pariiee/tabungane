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
  const [tab, setTab] = useState<"saldo" | "topup">("saldo");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myStanding, setMyStanding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (activeTab = tab, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/leaderboard?tab=${activeTab}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setMyStanding(data.my_standing || null);
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

  const rank1 = leaderboard.find((m) => m.rank === 1);
  const rank2 = leaderboard.find((m) => m.rank === 2);
  const rank3 = leaderboard.find((m) => m.rank === 3);
  const restList = leaderboard.filter((m) => m.rank > 3);

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Top Header & Centered Segmented Control */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white">
            Leaderboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Peringkat pencapaian mahasiswa. Nilai saldo tunduk pada izin privasi masing-masing.
          </p>
        </div>

        {/* 2 Recommended Categories Segmented Tab (Pill Style seperti Referensi) */}
        <div className="inline-flex items-center p-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <button
            onClick={() => {
              setTab("saldo");
              setLoading(true);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "saldo"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Top Saldo</span>
          </button>
          <button
            onClick={() => {
              setTab("topup");
              setLoading(true);
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "topup"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Top Setoran</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
            Memuat data leaderboard...
          </div>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-xs text-gray-400 dark:text-zinc-500">
          Belum ada data peringkat untuk kategori ini.
        </div>
      ) : (
        <>
          {/* Olympic-Style 3D Podium Showcase (Sesuai Referensi Gambar) */}
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto">
              {/* 2nd Place (Left) */}
              {rank2 ? (
                <div className="flex flex-col items-center">
                  {/* Avatar & Player Info */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 flex items-center justify-center font-bold text-lg text-black dark:text-white shadow-md overflow-hidden">
                        {rank2.foto_url ? (
                          <img src={rank2.foto_url} alt={rank2.nama} className="w-full h-full object-cover" />
                        ) : (
                          rank2.nama?.charAt(0) || "2"
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-1 bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 p-1 rounded-full border border-white dark:border-zinc-900">
                        <Medal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="font-bold text-xs text-black dark:text-white truncate max-w-[90px] sm:max-w-[120px] text-center">
                      {rank2.nama}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {rank2.nama_kelas}
                    </span>
                    {/* Value Badge */}
                    <div className="mt-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[11px] font-mono font-bold text-black dark:text-white border border-gray-200 dark:border-zinc-700 max-w-full truncate">
                      {rank2.display_value ? (
                        rank2.display_value
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans font-normal opacity-80">
                          <EyeOff className="w-3 h-3" />
                          <span>•••••••</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2nd Pedestal Block */}
                  <div className="w-full h-28 sm:h-36 rounded-t-2xl bg-gradient-to-b from-gray-200 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-t-2 border-x-2 border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-4xl sm:text-5xl font-black text-gray-400 dark:text-zinc-600">
                      2
                    </span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 1st Place (Center - Tallest & Elevated) */}
              {rank1 ? (
                <div className="flex flex-col items-center -mt-6">
                  {/* Avatar & Player Info */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="relative mb-2">
                      <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-black dark:bg-white border-2 border-amber-400 dark:border-amber-300 flex items-center justify-center font-black text-xl text-white dark:text-black shadow-xl overflow-hidden">
                        {rank1.foto_url ? (
                          <img src={rank1.foto_url} alt={rank1.nama} className="w-full h-full object-cover" />
                        ) : (
                          rank1.nama?.charAt(0) || "1"
                        )}
                      </div>
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black p-1 rounded-full shadow-md">
                        <Crown className="w-4 h-4" />
                      </div>
                    </div>
                    <span className="font-extrabold text-xs sm:text-sm text-black dark:text-white truncate max-w-[100px] sm:max-w-[140px] text-center">
                      {rank1.nama}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {rank1.nama_kelas}
                    </span>
                    {/* Value Badge */}
                    <div className="mt-2 px-3 py-1 rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-mono font-bold border border-black dark:border-white shadow-sm max-w-full truncate">
                      {rank1.display_value ? (
                        rank1.display_value
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans font-normal opacity-90">
                          <EyeOff className="w-3 h-3" />
                          <span>•••••••</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1st Pedestal Block */}
                  <div className="w-full h-36 sm:h-48 rounded-t-2xl bg-gradient-to-b from-black to-zinc-900 text-white dark:from-zinc-700 dark:to-zinc-800 border-t-2 border-x-2 border-amber-400 dark:border-amber-400 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-5xl sm:text-6xl font-black text-amber-400 dark:text-amber-300">
                      1
                    </span>
                  </div>
                </div>
              ) : (
                <div />
              )}

              {/* 3rd Place (Right) */}
              {rank3 ? (
                <div className="flex flex-col items-center">
                  {/* Avatar & Player Info */}
                  <div className="flex flex-col items-center mb-3">
                    <div className="relative mb-2">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 border-2 border-amber-700/50 dark:border-amber-700/50 flex items-center justify-center font-bold text-lg text-black dark:text-white shadow-md overflow-hidden">
                        {rank3.foto_url ? (
                          <img src={rank3.foto_url} alt={rank3.nama} className="w-full h-full object-cover" />
                        ) : (
                          rank3.nama?.charAt(0) || "3"
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-1 bg-amber-100 dark:bg-zinc-700 text-amber-800 dark:text-amber-500 p-1 rounded-full border border-white dark:border-zinc-900">
                        <Medal className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="font-bold text-xs text-black dark:text-white truncate max-w-[90px] sm:max-w-[120px] text-center">
                      {rank3.nama}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {rank3.nama_kelas}
                    </span>
                    {/* Value Badge */}
                    <div className="mt-2 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[11px] font-mono font-bold text-black dark:text-white border border-gray-200 dark:border-zinc-700 max-w-full truncate">
                      {rank3.display_value ? (
                        rank3.display_value
                      ) : (
                        <span className="inline-flex items-center gap-1 font-sans font-normal opacity-80">
                          <EyeOff className="w-3 h-3" />
                          <span>•••••••</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3rd Pedestal Block */}
                  <div className="w-full h-20 sm:h-28 rounded-t-2xl bg-gradient-to-b from-gray-200 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 border-t-2 border-x-2 border-gray-300 dark:border-zinc-700 flex flex-col items-center justify-center shadow-inner">
                    <span className="text-4xl sm:text-5xl font-black text-gray-400 dark:text-zinc-600">
                      3
                    </span>
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>

          {/* User's Personal Status Banner Pill (Identik seperti di Gambar Referensi) */}
          {myStanding && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs text-xs font-medium text-gray-700 dark:text-zinc-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Posisi Anda:{" "}
                  <strong className="text-black dark:text-white font-bold">
                    Peringkat #{myStanding.rank}
                  </strong>{" "}
                  dari {myStanding.total_students} mahasiswa
                </span>
                <Link
                  href="/akun"
                  className="text-[11px] text-gray-400 hover:text-black dark:hover:text-white underline underline-offset-2 ml-1"
                >
                  Ubah Privasi
                </Link>
              </div>
            </div>
          )}

          {/* Ranking Cards List (Ranks 4 - 10) Strip Card Format */}
          {restList.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500 px-1">
                Peringkat Berikutnya (Top 4 - 10)
              </div>

              {restList.map((m) => (
                <div
                  key={m.user_id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    m.is_me
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-xs font-semibold"
                      : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  {/* Rank & User Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono font-bold text-xs sm:text-sm w-7 text-center shrink-0">
                      #{m.rank}
                    </span>

                    <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-black dark:text-white shrink-0 overflow-hidden">
                      {m.foto_url ? (
                        <img src={m.foto_url} alt={m.nama} className="w-full h-full object-cover" />
                      ) : (
                        m.nama?.charAt(0) || "U"
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">
                          {m.nama}
                        </span>
                        {m.is_me && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            m.is_me && "bg-white/20 dark:bg-black/20"
                          }`}>
                            Anda
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] block truncate ${m.is_me ? "opacity-80" : "text-gray-400 dark:text-zinc-500"}`}>
                        {m.nim} &bull; {m.nama_kelas}
                      </span>
                    </div>
                  </div>

                  {/* Value Badge */}
                  <div className="text-right shrink-0">
                    {m.display_value !== null ? (
                      <span className="font-mono font-bold text-xs sm:text-sm">
                        {m.display_value}
                      </span>
                    ) : (
                      <span className={`text-[11px] inline-flex items-center gap-1 font-sans ${
                        m.is_me ? "opacity-80" : "text-gray-400 dark:text-zinc-500"
                      }`}>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>•••••••</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
