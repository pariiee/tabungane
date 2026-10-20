"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LeaderboardSkeleton } from "@/components/Skeletons";
import {
  Crown,
  Wallet,
  ArrowDownLeft,
  EyeOff,
} from "lucide-react";

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"saldo" | "topup">("saldo");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myStanding, setMyStanding] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (activeTab = tab) => {
    try {
      const res = await fetch(`/api/leaderboard?tab=${activeTab}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setMyStanding(data.my_standing || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(tab);
  }, [tab]);

  // Always extract Top 3
  const rank1 = leaderboard[0] || null;
  const rank2 = leaderboard[1] || null;
  const rank3 = leaderboard[2] || null;
  const restList = leaderboard.slice(3);

  const formatDeadline = (dl: string) => {
    if (!dl) return "-";
    const diff = new Date(dl).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Selesai";
    if (days === 0) return "Hari ini";
    return `Sisa ${days} hari`;
  };

  // Helper renderer untuk kartu podium 3D
  const renderPodiumBlock = (
    item: any,
    rankNum: number,
    heightPx: number,
    badgeColor: string,
    isFirst = false
  ) => {
    const isMe = item?.is_me;
    const progressPct = item ? item.progress_pct : 0;

    return (
      <div className="w-[31%] flex flex-col items-center">
        {/* Avatar & Player Info */}
        <div className="flex flex-col items-center mb-2.5 w-full">
          {/* Avatar Container dengan Ring Putih 3px */}
          <div className="relative mb-2">
            <div
              className={`rounded-full border-[3px] border-white dark:border-zinc-900 bg-gray-200 dark:bg-zinc-800 shadow-md flex items-center justify-center font-bold text-black dark:text-white overflow-hidden ${
                isFirst ? "w-16 h-16 sm:w-18 sm:h-18" : "w-14 h-14"
              }`}
            >
              {item?.foto_url ? (
                <img
                  src={item.foto_url}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              <span className={item?.foto_url ? "hidden" : "block text-sm sm:text-base"}>
                {item ? item.nama?.charAt(0) : "-"}
              </span>
            </div>

            {/* Mahkota Emas hanya untuk Juara 1 */}
            {isFirst && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[#c9a227] drop-shadow-sm">
                <Crown className="w-5 h-5 fill-[#c9a227]" />
              </div>
            )}

            {/* Badge Peringkat Kecil di Pojok Kanan Atas */}
            <div
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white border-2 border-white dark:border-zinc-900 shadow-xs"
              style={{ backgroundColor: badgeColor }}
            >
              {rankNum}
            </div>
          </div>

          {/* Nama Mahasiswa */}
          <span className="font-bold text-[11px] sm:text-xs text-black dark:text-white truncate max-w-full text-center px-0.5">
            {item ? item.nama : "-"}
          </span>

          {/* Pill Persen Progres */}
          {item ? (
            <div className="mt-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-gray-700 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-700/60">
              {progressPct}%
            </div>
          ) : (
            <div className="mt-1 px-2 py-0.5 rounded-full bg-gray-50 dark:bg-zinc-900 text-[10px] text-gray-400">
              -
            </div>
          )}

          {/* Nominal Saldo: Tampil jika user mengizinkan (tampilkan_saldo == 1), sensor jika privat */}
          {item && (
            <div className="mt-1 text-[11px] font-mono font-bold text-black dark:text-white flex items-center gap-1">
              {item.display_value ? (
                <span>{item.display_value}</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-sans font-normal text-gray-400 dark:text-zinc-500">
                  <EyeOff className="w-3 h-3" />
                  <span>•••••••</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* 3D Podium Block: Sisi Atas Lebih Terang, Sisi Depan Gradasi Memudar ke Bawah */}
        <div className="w-full flex flex-col items-center">
          {/* Top Bevel (Sisi Atas) */}
          <div className="w-full h-2 rounded-t-sm bg-gray-200 dark:bg-[#4a4b54] border-t border-x border-gray-300/80 dark:border-zinc-700" />
          {/* Front Face (Sisi Depan dengan Angka Transparan) */}
          <div
            className="w-full bg-gradient-to-b from-[#d4d4d4] to-[#e5e5e5] dark:from-[#3a3b42] dark:to-[#25262a] border-x border-b border-gray-300/60 dark:border-zinc-750 flex items-center justify-center relative shadow-inner overflow-hidden"
            style={{ height: `${heightPx}px` }}
          >
            <span className="text-3xl sm:text-4xl font-black text-black/20 dark:text-white/20 select-none">
              {rankNum}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header & Category Switcher */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white">
            Leaderboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Peringkat pencapaian tabungan mahasiswa.
          </p>
        </div>

        {/* 2 Tabs: Top Saldo / Top Setoran */}
        <div className="inline-flex items-center p-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setTab("saldo");
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "saldo"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Top Saldo</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("topup");
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              tab === "topup"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Top Setoran</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : (
        <>
          {/* 1. 3D Podium Showcase (Selalu 3 Kolom: 2, 1, 3) */}
          <div className="pt-4 pb-2">
            <div className="flex items-end justify-between max-w-md sm:max-w-lg mx-auto">
              {/* Kolom 2 (Kiri, Tinggi 95px, Perak #a8adb3) */}
              {renderPodiumBlock(rank2, 2, 95, "#a8adb3")}

              {/* Kolom 1 (Tengah, Tinggi 130px, Emas #c9a227, Mahkota) */}
              {renderPodiumBlock(rank1, 1, 130, "#c9a227", true)}

              {/* Kolom 3 (Kanan, Tinggi 70px, Perunggu #c0623b) */}
              {renderPodiumBlock(rank3, 3, 70, "#c0623b")}
            </div>
          </div>

          {/* 2. Panel Daftar Peringkat 4 - 10 (Rounded-t-3xl Menimpa Dasar Podium) */}
          <div className="relative z-20 -mt-3 max-w-xl mx-auto rounded-t-3xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-md p-4 sm:p-5">
            {/* Header Mini Panel */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 text-[10px]">
                Peringkat 4 - 10
              </span>
              {myStanding && (
                <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Posisi Kamu:{" "}
                  <strong className="text-black dark:text-white font-bold">
                    #{myStanding.rank}
                  </strong>{" "}
                  / {myStanding.total_students}
                </span>
              )}
            </div>

            {/* List Rows */}
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-[420px] overflow-y-auto">
              {restList.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                  Belum ada data peringkat 4 ke bawah.
                </div>
              ) : (
                restList.map((m) => {
                  const isMe = m.is_me;

                  return (
                    <div
                      key={m.user_id}
                      className={`py-3 px-2 flex items-center justify-between gap-3 transition-colors rounded-xl my-1 ${
                        isMe
                          ? "bg-gray-100 dark:bg-zinc-800/80 font-semibold"
                          : "hover:bg-gray-50/80 dark:hover:bg-zinc-850"
                      }`}
                    >
                      {/* Left: Rank # + Avatar + Nama */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-mono font-bold text-xs sm:text-sm w-6 text-center text-gray-500 dark:text-zinc-400 shrink-0">
                          {m.rank}
                        </span>

                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs text-black dark:text-white shrink-0 overflow-hidden border border-gray-200/60 dark:border-zinc-700/60">
                          {m.foto_url ? (
                            <img
                              src={m.foto_url}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            m.nama?.charAt(0) || "U"
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold truncate text-black dark:text-white">
                              {m.nama}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold shrink-0">
                                Kamu
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate">
                            {m.nim} &bull; {m.nama_kelas}
                          </span>
                        </div>
                      </div>

                      {/* Right: Progress bar tipis 4px + persen + Nominal */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {/* Progress Bar 4px */}
                        <div className="hidden sm:block w-20 sm:w-24 h-1 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-black dark:bg-white rounded-full transition-all duration-500"
                            style={{ width: `${m.progress_pct}%` }}
                          />
                        </div>

                        <span className="font-mono text-[11px] font-bold text-gray-600 dark:text-zinc-300 w-8 text-right">
                          {m.progress_pct}%
                        </span>

                        {/* Nominal Saldo: Tampil jika user mengizinkan (tampilkan_saldo == 1), sensor jika privat */}
                        <div className="w-20 sm:w-24 text-right">
                          {m.display_value ? (
                            <span className="font-mono text-xs sm:text-sm font-bold text-black dark:text-white">
                              {m.display_value}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-sans font-normal text-gray-400 dark:text-zinc-500">
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>•••••••</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
