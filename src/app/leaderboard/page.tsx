"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LeaderboardSkeleton } from "@/components/Skeletons";
import {
  Crown,
  EyeOff,
  Clock,
  Calendar,
  Trophy
} from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<"today" | "month" | "year">("month");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myStanding, setMyStanding] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadData = async (activePeriod = period) => {
    try {
      const res = await fetch(`/api/leaderboard?period=${activePeriod}`);
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
      setMyStanding(data.my_standing || null);
      setCurrentUserRole(data.current_user_role || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

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
    if (!item) {
      return (
        <div className="w-[31%] flex flex-col items-center opacity-30 select-none">
          <div className="flex flex-col items-center mb-2.5 w-full">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center text-xs text-gray-400 mb-2 font-mono">
              -
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Belum Terisi</span>
          </div>
          <div
            className="w-full bg-gray-100 dark:bg-zinc-800/40 border-t border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center"
            style={{ height: `${heightPx}px` }}
          >
            <span className="text-2xl font-black text-gray-400/30">{rankNum}</span>
          </div>
        </div>
      );
    }

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

          {/* Pill Nama Kelas */}
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-medium text-gray-700 dark:text-zinc-300 border border-gray-200/60 dark:border-zinc-700/60 truncate max-w-[90px]">
            {item ? item.nama_kelas : "-"}
          </div>

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
            Top Penabung
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Peringkat keaktifan menabung dan setoran kas mahasiswa.
          </p>
        </div>

        {/* 3 Tabs: Hari Ini / Bulan Ini / Tahun Ini */}
        <div className="inline-flex items-center p-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setPeriod("today");
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              period === "today"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hari Ini</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod("month");
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              period === "month"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bulan Ini</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod("year");
              setLoading(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              period === "year"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Tahun Ini</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : leaderboard.length === 0 ? (
        <div className="max-w-md mx-auto my-8 p-8 rounded-2xl bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-zinc-850 flex items-center justify-center text-gray-400 dark:text-zinc-500">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100">
              Belum Ada Penabung
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {currentUserRole === "admin" || currentUserRole === "super_admin"
                ? `Belum ada transaksi tabungan dari mahasiswa untuk periode ${period === "today" ? "hari ini" : period === "month" ? "bulan ini" : "tahun ini"}.`
                : period === "today"
                ? "Belum ada transaksi tabungan hari ini. Jadilah mahasiswa pertama yang menabung hari ini!"
                : period === "month"
                ? "Belum ada transaksi tabungan yang tercatat di bulan ini."
                : "Belum ada transaksi tabungan yang tercatat di tahun ini."}
            </p>
          </div>
          {/* Tombol Mulai Nabung hanya untuk Mahasiswa / bukan Admin */}
          {currentUserRole !== "admin" && currentUserRole !== "super_admin" ? (
            <Link
              href="/topup"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <span>Mulai Nabung Sekarang</span>
            </Link>
          ) : (
            <Link
              href="/admin/transaksi"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white hover:bg-gray-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              <span>Pantau Transaksi</span>
            </Link>
          )}
        </div>
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
              {myStanding && currentUserRole !== "admin" && currentUserRole !== "super_admin" && (
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
                            {m.nim}
                          </span>
                        </div>
                      </div>

                      {/* Right: Nama Kelas Pill + Nominal */}
                      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {/* Pill Kelas */}
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-[10px] font-medium text-gray-600 dark:text-zinc-400 border border-gray-200/50 dark:border-zinc-700/50">
                          {m.nama_kelas}
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
