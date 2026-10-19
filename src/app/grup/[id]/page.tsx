"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  Users,
  Target,
  Calendar,
  Wallet,
  ArrowLeft,
  QrCode,
  Medal,
  Crown,
  CheckCircle2,
  Clock,
  Layers
} from "lucide-react";

export default function GroupDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/student/grup/${id}`)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-gray-400 dark:text-zinc-500 animate-pulse">Memuat data event...</div>
      </div>
    );
  }

  const grup = data?.grup;
  const leaderboard = data?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Back button & Action */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Dashboard</span>
        </Link>
        <Link
          href={`/topup?grup_id=${grup?.id}`}
          className="h-8 px-3.5 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-xs"
        >
          <QrCode className="w-3 h-3" />
          <span>Top Up Event Ini</span>
        </Link>
      </div>

      {/* Header Info Banner */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 rounded-full">
              Kelas {grup?.nama_kelas}
            </span>
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Deadline: {grup?.deadline} ({grup?.sisa_hari} hari lagi)
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-2">{grup?.nama}</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 dark:border-zinc-800/50">
          <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 rounded-lg">
            <div className="text-[11px] text-gray-400 dark:text-zinc-500">Total Terkumpul Grup</div>
            <div className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-0.5">
              Rp {grup?.total_terkumpul.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 rounded-lg">
            <div className="text-[11px] text-gray-400 dark:text-zinc-500">Target per Mahasiswa</div>
            <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              Rp {grup?.target_per_mahasiswa.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 border border-gray-100 dark:border-zinc-800/60 rounded-lg">
            <div className="text-[11px] text-gray-400 dark:text-zinc-500">Total Anggota Terdaftar</div>
            <div className="text-base font-bold text-gray-900 dark:text-zinc-100 mt-0.5">
              {leaderboard.length} Mahasiswa
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Leaderboard Progres Tabungan</span>
            </h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
              Diurutkan berdasarkan persentase target yang telah dicapai
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Progres Target</th>
                <th className="py-3 px-4 text-right">Saldo Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {leaderboard.map((m: any) => {
                const isMe = m.is_me;
                const progressCapped = Math.min(m.progress_pct, 100);

                let rankBadge = (
                  <span className="font-semibold text-gray-400 dark:text-zinc-500 text-xs font-mono">#{m.rank}</span>
                );
                if (m.rank === 1) rankBadge = <Crown className="w-4 h-4 text-amber-500 inline" />;
                else if (m.rank === 2) rankBadge = <Medal className="w-4 h-4 text-slate-400 inline" />;
                else if (m.rank === 3) rankBadge = <Medal className="w-4 h-4 text-amber-700 inline" />;

                return (
                  <tr
                    key={m.user_id}
                    className={`hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors ${
                      isMe ? "bg-emerald-50/30 dark:bg-emerald-950/20 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 dark:text-zinc-100 font-medium">{m.nama}</span>
                        {isMe && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Saya
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">{m.nim}</div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-gray-700 dark:text-zinc-300">{m.progress_pct}%</span>
                          {m.progress_pct >= 100 && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Target Tercapai
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                            style={{ width: `${progressCapped}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.saldo !== null ? (
                        <span className="font-bold text-gray-900 dark:text-zinc-100">
                          Rp {m.saldo.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 dark:text-zinc-500 italic">Privat</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
