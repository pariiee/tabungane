"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Layers, ShieldCheck, QrCode, RefreshCw, Eye, EyeOff } from "lucide-react";

export default function LeaderboardPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedGrupId, setSelectedGrupId] = useState("");
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (grupId?: string, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const url = `/api/leaderboard${grupId ? `?grup_id=${grupId}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setEvents(data.events || []);
      setCurrentEvent(data.current_event || null);
      setLeaderboard(data.leaderboard || []);
      if (!selectedGrupId && data.current_event) {
        setSelectedGrupId(data.current_event.id);
      }
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

  const handleSelectEvent = (grupId: string) => {
    setSelectedGrupId(grupId);
    loadData(grupId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">
          Memuat data leaderboard...
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 inline-flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span>Transparansi Progres</span>
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
            Leaderboard Peringkat Tabungan
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Peringkat pencapaian target tabungan mahasiswa. Saldo nominal hanya tampil jika diizinkan oleh pemilik akun.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(selectedGrupId, true)}
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
            <span>Top Up</span>
          </Link>
        </div>
      </div>

      {/* Event Filter & Summary Card */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Pilih Event Sakune:</span>
          </div>

          <select
            value={selectedGrupId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white max-w-xs"
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nama} ({e.nama_kelas})
              </option>
            ))}
          </select>
        </div>

        {currentEvent && (
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-gray-400 dark:text-zinc-500">Target per Mahasiswa:</span>{" "}
              <strong className="text-black dark:text-white font-mono">
                Rp {currentEvent.target_per_mahasiswa?.toLocaleString("id-ID")}
              </strong>
            </div>
            <div>
              <span className="text-gray-400 dark:text-zinc-500">Batas Waktu:</span>{" "}
              <span className="text-gray-700 dark:text-zinc-300 font-medium">{currentEvent.deadline}</span>
            </div>
            <div>
              <span className="text-gray-400 dark:text-zinc-500">Total Partisipan:</span>{" "}
              <strong className="text-black dark:text-white">{leaderboard.length} Mahasiswa</strong>
            </div>
          </div>
        )}
      </div>

      {/* Top 3 Podium (jika minimal ada 3 data) */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Rank 2 */}
          <div className="order-2 sm:order-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs text-center flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1">🥈</div>
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
                JUARA 2
              </span>
              <h3 className="font-bold text-black dark:text-white text-sm mt-1 truncate">
                {top3[1].nama}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">{top3[1].nim}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {top3[1].progress_pct}%
              </div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                {top3[1].saldo !== null ? `Rp ${top3[1].saldo.toLocaleString("id-ID")}` : "•••••• (Privasi)"}
              </div>
            </div>
          </div>

          {/* Rank 1 */}
          <div className="order-1 sm:order-2 bg-white dark:bg-zinc-900 border-2 border-amber-400/60 dark:border-amber-500/50 rounded-lg p-5 shadow-xs text-center flex flex-col justify-between relative">
            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              TOP 1
            </span>
            <div>
              <div className="text-3xl mb-1 mt-1">👑</div>
              <h3 className="font-extrabold text-black dark:text-white text-base truncate">
                {top3[0].nama}
              </h3>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{top3[0].nim}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {top3[0].progress_pct}%
              </div>
              <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-0.5">
                {top3[0].saldo !== null ? `Rp ${top3[0].saldo.toLocaleString("id-ID")}` : "•••••• (Privasi)"}
              </div>
            </div>
          </div>

          {/* Rank 3 */}
          <div className="order-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs text-center flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-1">🥉</div>
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-zinc-500 tracking-wider">
                JUARA 3
              </span>
              <h3 className="font-bold text-black dark:text-white text-sm mt-1 truncate">
                {top3[2].nama}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">{top3[2].nim}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
              <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                {top3[2].progress_pct}%
              </div>
              <div className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                {top3[2].saldo !== null ? `Rp ${top3[2].saldo.toLocaleString("id-ID")}` : "•••••• (Privasi)"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-semibold border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">RANK</th>
                <th className="py-3 px-4">MAHASISWA</th>
                <th className="py-3 px-4">PROGRES TARGET</th>
                <th className="py-3 px-4 text-right">NOMINAL TABUNGAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400 dark:text-zinc-500">
                    Belum ada mahasiswa yang terdaftar di event ini.
                  </td>
                </tr>
              ) : (
                leaderboard.map((m) => {
                  const isTop1 = m.rank === 1;
                  const isTop2 = m.rank === 2;
                  const isTop3 = m.rank === 3;
                  const progressCapped = Math.min(m.progress_pct, 100);

                  return (
                    <tr
                      key={m.user_id}
                      className={`hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors ${
                        m.is_me ? "bg-emerald-50/40 dark:bg-emerald-950/20 font-medium" : ""
                      }`}
                    >
                      <td className="py-3 px-4 text-center font-bold">
                        {isTop1 ? "🥇" : isTop2 ? "🥈" : isTop3 ? "🥉" : `#${m.rank}`}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">
                            {m.nama}
                          </span>
                          {m.is_me && (
                            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Saya
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">
                          {m.nim}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-xs h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressCapped}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-gray-900 dark:text-zinc-100 text-[11px] w-10 text-right">
                            {m.progress_pct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        {m.saldo !== null ? (
                          <span className="text-black dark:text-white">
                            Rp {m.saldo.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-zinc-500 text-[11px] inline-flex items-center gap-1 font-sans">
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
    </div>
  );
}
