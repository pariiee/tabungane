"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Clock, User, CheckCircle2 } from "lucide-react";

export default function AdminLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/log")
      .then((res) => res.json())
      .then((d) => {
        setLogs(d.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-purple-600" />
          Audit Log Aktivitas Admin
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Jejak rekaman siapa melakukan aksi apa dan kapan untuk transparansi dan audit sistem.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Riwayat Log Keamanan</h2>
          <span className="text-xs text-gray-400">{logs.length} catatan aktivitas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Admin Pelaksana</th>
                <th className="py-3 px-4">Jenis Aksi</th>
                <th className="py-3 px-4">Target / Entitas</th>
                <th className="py-3 px-4">Detail Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-sans">
                    Memuat log audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400 font-sans">
                    Belum ada catatan log audit.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-gray-900">
                      {l.nama_admin || "System Admin"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold">
                        {l.aksi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{l.target}</td>
                    <td className="py-3 px-4 font-sans text-gray-700">{l.detail || "-"}</td>
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
