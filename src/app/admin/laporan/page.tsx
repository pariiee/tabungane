"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TableRowsSkeleton } from "@/components/Skeletons";
import { FileText, Download, Filter, Users, Wallet, Trophy, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminLaporanPage() {
  const searchParams = useSearchParams();
  const initialGrupId = searchParams.get("grup_id") || "";

  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGrupId, setSelectedGrupId] = useState(initialGrupId);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => {
        const grps = d.data || [];
        setGroups(grps);
        if (!selectedGrupId && grps.length > 0) {
          setSelectedGrupId(grps[0].id);
        }
      });
  }, []);

  const loadPreview = () => {
    if (!selectedGrupId) return;
    setLoading(true);
    fetch(`/api/student/grup/${selectedGrupId}`)
      .then((res) => res.json())
      .then((d) => {
        setPreviewData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPreview();
  }, [selectedGrupId]);

  const handleExportCsv = () => {
    if (!selectedGrupId) return;
    window.location.href = `/api/admin/laporan/export?grup_id=${selectedGrupId}`;
  };

  const grup = previewData?.grup;
  const leaderboard = previewData?.leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Ekspor Laporan Tabungan</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Unduh laporan rekapitulasi setoran dan tabungan mahasiswa per grup dalam format file CSV.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!selectedGrupId || leaderboard.length === 0}
          className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download File CSV</span>
        </button>
      </div>

      {/* Selector Grup */}
      <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Pilih Event Sakune:</label>
        <select
          value={selectedGrupId}
          onChange={(e) => setSelectedGrupId(e.target.value)}
          className="h-8 px-2.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-medium text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white max-w-sm"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama} ({g.nama_kelas})
            </option>
          ))}
        </select>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{grup?.nama || "Pratinjau Data Laporan"}</h2>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
              Kelas {grup?.nama_kelas} &bull; Target: Rp {grup?.target_per_mahasiswa?.toLocaleString("id-ID")} &bull; Terkumpul: Rp {grup?.total_terkumpul?.toLocaleString("id-ID")}
            </p>
          </div>
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">
            {leaderboard.length} Mahasiswa terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">NIM</th>
                <th className="py-3 px-4">Nama Mahasiswa</th>
                <th className="py-3 px-4">Progres (%)</th>
                <th className="py-3 px-4 text-right">Saldo Terkumpul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {loading ? (
                <TableRowsSkeleton rows={5} cols={5} />
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                    Tidak ada anggota di grup ini.
                  </td>
                </tr>
              ) : (
                leaderboard.map((m: any) => (
                  <tr key={m.user_id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-4 text-center font-medium text-gray-400 dark:text-zinc-500 text-xs">
                      {m.rank}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-700 dark:text-zinc-300">{m.nim}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-zinc-100">{m.nama}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-700 dark:text-zinc-300">
                      {m.progress_pct}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      {m.saldo !== null ? `Rp ${m.saldo.toLocaleString("id-ID")}` : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
