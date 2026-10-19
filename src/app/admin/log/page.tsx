"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Clock, User, CheckCircle2, RefreshCw } from "lucide-react";

export default function AdminLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch("/api/admin/log")
      .then((res) => res.json())
      .then((d) => {
        setLogs(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Audit Log Aktivitas Admin</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Jejak rekaman siapa melakukan aksi apa dan kapan untuk transparansi dan audit sistem.
          </p>
        </div>

        <div>
          <button
            onClick={loadData}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Riwayat Log Keamanan</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{logs.length} catatan aktivitas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Pelaksana</th>
                <th className="py-3 px-4">Jenis Aksi</th>
                <th className="py-3 px-4">Target Entitas</th>
                <th className="py-3 px-4">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                    Memuat log audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                    Belum ada catatan log audit.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 dark:text-zinc-400 whitespace-nowrap text-[11px]">
                      {new Date(l.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-zinc-100">
                      {l.nama_admin || "System Admin"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[10px]">
                        {l.aksi}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 dark:text-zinc-400 font-mono text-[11px]">{l.target}</td>
                    <td className="py-3.5 px-4 text-gray-700 dark:text-zinc-300 max-w-sm truncate">{l.detail || "-"}</td>
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
