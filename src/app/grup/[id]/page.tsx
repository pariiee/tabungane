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
  CheckCircle2,
  Clock
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
        <div className="text-sm text-gray-500 animate-pulse">Memuat data grup...</div>
      </div>
    );
  }

  const grup = data?.grup;
  const leaderboard = data?.leaderboard || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Dashboard
      </Link>

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Kelas {grup?.nama_kelas}
              </span>
              <span className="text-xs text-gray-400">
                Deadline: {grup?.deadline} ({grup?.sisa_hari} hari lagi)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{grup?.nama}</h1>
          </div>

          <Link
            href={`/topup?grup_id=${grup?.id}`}
            className="inline-flex items-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm self-start sm:self-auto"
          >
            <QrCode className="w-4 h-4" />
            Top Up Grup Ini
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500">Total Terkumpul Grup</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              Rp{grup?.total_terkumpul.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500">Target per Mahasiswa</div>
            <div className="text-lg font-bold text-emerald-600 mt-0.5">
              Rp{grup?.target_per_mahasiswa.toLocaleString("id-ID")}
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-xl">
            <div className="text-xs text-gray-500">Total Mahasiswa</div>
            <div className="text-lg font-bold text-gray-900 mt-0.5">
              {leaderboard.length} Anggota
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Leaderboard Progres Tabungan
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Diurutkan berdasarkan persentase target yang telah dicapai
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Mahasiswa</th>
                <th className="py-3 px-4">Progres Target</th>
                <th className="py-3 px-4 text-right">Saldo Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaderboard.map((m: any) => {
                const isMe = m.is_me;
                const progressCapped = Math.min(m.progress_pct, 100);

                let rankBadge = (
                  <span className="font-semibold text-gray-500 text-xs">{m.rank}</span>
                );
                if (m.rank === 1) {
                  rankBadge = <span className="text-base">🥇</span>;
                } else if (m.rank === 2) {
                  rankBadge = <span className="text-base">🥈</span>;
                } else if (m.rank === 3) {
                  rankBadge = <span className="text-base">🥉</span>;
                }

                return (
                  <tr
                    key={m.user_id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isMe ? "bg-emerald-50/60 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">{rankBadge}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-semibold">{m.nama}</span>
                        {isMe && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                            Saya
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{m.nim}</div>
                    </td>
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-gray-700">{m.progress_pct}%</span>
                          {m.progress_pct >= 100 && (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Target Tercapai
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${
                              m.progress_pct >= 100 ? "bg-emerald-500" : "bg-teal-500"
                            }`}
                            style={{ width: `${progressCapped}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {m.saldo !== null ? (
                        <span className="font-bold text-gray-900">
                          Rp{m.saldo.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Privat</span>
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
