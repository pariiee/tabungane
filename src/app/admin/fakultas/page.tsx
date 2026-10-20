"use client";

import { useEffect, useState } from "react";
import { TableRowsSkeleton } from "@/components/Skeletons";
import {
  Landmark,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";

export default function AdminFakultasPage() {
  const [fakultasList, setFakultasList] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [uRes, fRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/fakultas"),
      ]);
      const uData = await uRes.json();
      const fData = await fRes.json();

      setCurrentUser(uData.user);
      setFakultasList(fData.data || []);
    } catch {
      setError("Gagal memuat data Fakultas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const handleAddFakultas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/fakultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, kode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah Fakultas");

      setSuccess(`Fakultas ${nama} (${kode.toUpperCase()}) berhasil ditambahkan!`);
      setNama("");
      setKode("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFakultas = async (id: string, namaFakultas: string) => {
    if (!confirm(`Hapus Fakultas "${namaFakultas}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/fakultas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus fakultas");

      setSuccess(`Fakultas "${namaFakultas}" berhasil dihapus.`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold tracking-wider uppercase">
              TIM DEVELOPER CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white mt-1">
            Fakultas
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Tingkat tertinggi hierarki kampus. Setiap fakultas membawahi beberapa Program Studi.
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            loadData();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-sm bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-sm bg-green-50 dark:bg-green-950/30 border border-green-200 dark:green-900/50 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Fakultas (Hanya Super Admin) */}
        {isSuperAdmin ? (
          <div className="lg:col-span-1">
            <div className="border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-950 p-6">
              <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2 mb-1">
                <Landmark className="w-4 h-4" />
                Tambah Fakultas
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
                Daftarkan fakultas baru (contoh: Fakultas Teknik, Fakultas Ekonomi, Fakultas Hukum, dll).
              </p>

              <form onSubmit={handleAddFakultas} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Nama Fakultas
                  </label>
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Fakultas Teknik"
                    className="w-full px-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Kode Singkatan (Unik)
                  </label>
                  <input
                    type="text"
                    required
                    value={kode}
                    onChange={(e) => setKode(e.target.value.toUpperCase())}
                    placeholder="Contoh: FT, FEB, FK, FH"
                    className="w-full px-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white uppercase font-mono focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 block">
                    Digunakan untuk prefix dan pengelompokan prodi.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Menyimpan..." : "Simpan Fakultas"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-1">
            <div className="border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-950 p-6 space-y-3">
              <div className="w-10 h-10 rounded-sm bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
              </div>
              <h2 className="text-base font-bold text-black dark:text-white">
                Akses Khusus Tim Developer
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
                Halaman pengelolaan master Fakultas hanya dapat diakses oleh Tim Developer.
              </p>
            </div>
          </div>
        )}

        {/* Tabel Daftar Fakultas */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white">
                  Daftar Fakultas
                </h3>
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Total {fakultasList.length} Fakultas Aktif
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <TableRowsSkeleton rows={4} />
              </div>
            ) : fakultasList.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
                Belum ada Fakultas yang terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-900/50 text-[11px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Kode</th>
                      <th className="px-6 py-3 font-semibold">Nama Fakultas</th>
                      <th className="px-6 py-3 font-semibold text-center">Program Studi</th>
                      {isSuperAdmin && (
                        <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {fakultasList.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                        <td className="px-6 py-4 font-mono font-bold text-black dark:text-white">
                          <span className="px-2 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-xs border border-gray-200 dark:border-zinc-700">
                            {f.kode}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-black dark:text-white">
                          {f.nama}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                            <Building2 className="w-3 h-3" />
                            {f.total_prodi} Prodi
                          </span>
                        </td>
                        {isSuperAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteFakultas(f.id, f.nama)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                              title="Hapus Fakultas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
