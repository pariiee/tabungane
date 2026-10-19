"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileText, Download, Filter, Users, Wallet, Trophy, CheckCircle2 } from "lucide-react";

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

  useEffect(() => {
    if (!selectedGrupId) return;
    setLoading(true);
    fetch(`/api/student/grup/${selectedGrupId}`)
      .then((res) => res.json())
      .then((d) => {
        setPreviewData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-600" />
            Ekspor Laporan Tabungan
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Unduh laporan rekapitulasi setoran kas dan tabungan mahasiswa per grup dalam format file CSV.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={!selectedGrupId || leaderboard.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Download File CSV
        </button>
      </div>

      {/* Selector Grup */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
        <label className="text-xs font-semibold text-gray-700">Pilih Grup Tabungan:</label>
        <select
          value={selectedGrupId}
          onChange={(e) => setSelectedGrupId(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-purple-500 outline-none max-w-sm"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.nama} (Kelas {g.nama_kelas})
            </option>
          ))}
        </select>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">{grup?.nama || "Pratinjau Data"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelas {grup?.nama_kelas} &bull; Target per Mhs: Rp
              {grup?.target_per_mahasiswa?.toLocaleString("id-ID")} &bull; Total Terkumpul: Rp
              {grup?.total_terkumpul?.toLocaleString("id-ID")}
            </p>
          </div>
          <span className="text-xs text-gray-500 font-medium">
            {leaderboard.length} Mahasiswa terdata
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">NIM</th>
                <th className="py-3 px-4">Nama Mahasiswa</th>
                <th className="py-3 px-4">Progres (%)</th>
                <th className="py-3 px-4 text-right">Saldo Terkumpul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                    Memuat pratinjau laporan...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                    Tidak ada anggota di grup ini.
                  </td>
                </tr>
              ) : (
                leaderboard.map((m: any) => (
                  <tr key={m.user_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-center text-xs font-semibold text-gray-500">
                      {m.rank}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{m.nim}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{m.nama}</td>
                    <td className="py-3 px-4 text-xs font-bold text-purple-700">
                      {m.progress_pct}%
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600 text-sm">
                      {m.saldo !== null ? `Rp${m.saldo.toLocaleString("id-ID")}` : "-"}
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
