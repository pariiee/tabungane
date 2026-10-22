"use client";

import { useEffect, useState } from "react";
import { TableRowsSkeleton } from "@/components/Skeletons";
import CustomSelect from "@/components/CustomSelect";
import ConfirmModal from "@/components/ConfirmModal";
import ErrorTemplate from "@/components/ErrorTemplate";
import { GraduationCap, Plus, Trash2, Users, AlertCircle, CheckCircle2, RefreshCw, Building2 } from "lucide-react";

export default function AdminKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [prodiId, setProdiId] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nama, setNama] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);

  const loadData = async () => {
    try {
      const [kRes, pRes, uRes] = await Promise.all([
        fetch("/api/admin/kelas"),
        fetch("/api/admin/prodi"),
        fetch("/api/auth/me"),
      ]);
      const kData = await kRes.json();
      const pData = await pRes.json();
      const uData = await uRes.json();

      setKelasList(kData.data || []);
      setProdiList(pData.data || []);
      setCurrentUser(uData.user);

      if (pData.data && pData.data.length > 0 && !prodiId) {
        setProdiId(pData.data[0].id);
      }
    } catch {
      setError("Gagal memuat data kelas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSuperAdmin = currentUser?.role === "super_admin";

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          tahun_ajaran: tahunAjaran,
          prodi_id: isSuperAdmin ? prodiId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah kelas");

      setSuccess(`Kelas ${nama} berhasil ditambahkan!`);
      setNama("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteKelas = async (id: string, namaKelas: string) => {
    try {
      const res = await fetch(`/api/admin/kelas?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!loading && currentUser?.role === "admin_kelas") {
    return (
      <ErrorTemplate
        code="403"
        customMessage="Admin Kelas tidak memiliki akses kelola struktur kelas perkuliahan. Anda terfokus mengawasi kelas Anda sendiri."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Kelola Kelas Perkuliahan</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Daftar kelas perkuliahan beserta tahun ajaran untuk pengelompokan mahasiswa dan event tabungan.
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

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Tambah Kelas */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-5 shadow-xs">
        <h2 className="text-xs font-bold text-gray-900 dark:text-zinc-100 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-gray-700 dark:text-zinc-300" />
          <span>Tambah Kelas Baru</span>
        </h2>
        <form onSubmit={handleAddKelas} className={`grid grid-cols-1 ${isSuperAdmin ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3`}>
          {isSuperAdmin && (
            <div>
              <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Program Studi
              </label>
              <CustomSelect
                value={prodiId}
                onChange={setProdiId}
                options={prodiList.map((p) => ({
                  value: p.id,
                  label: `${p.nama} (${p.kode})`,
                }))}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 3A atau 4B"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Tahun Ajaran
            </label>
            <input
              type="text"
              required
              placeholder="2026/2027"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-9 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Simpan Kelas</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Kelas */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">Daftar Kelas Aktif</h2>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{kelasList.length} kelas terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Program Studi</th>
                <th className="py-3 px-4">Tahun Ajaran</th>
                <th className="py-3 px-4">Jumlah Mahasiswa</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {loading ? (
                <TableRowsSkeleton rows={4} cols={5} />
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                    Belum ada kelas yang dibuat.
                  </td>
                </tr>
              ) : (
                kelasList.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-zinc-100">{k.nama}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 border border-gray-200/60 dark:border-zinc-700/60">
                        <Building2 className="w-3 h-3 text-gray-400" />
                        {k.nama_prodi || "Sistem Informasi"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-zinc-400">{k.tahun_ajaran}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 font-medium text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/50 dark:border-zinc-700/40 px-2 py-0.5 rounded-full text-[11px]">
                        <Users className="w-3 h-3 text-gray-500" />
                        <span>{k.jumlah_mahasiswa} Mahasiswa</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDeleteTarget({ id: k.id, nama: k.nama })}
                        className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) handleDeleteKelas(deleteTarget.id, deleteTarget.nama);
        }}
        title="Hapus Kelas?"
        message={`Hapus kelas "${deleteTarget?.nama}"? Data mahasiswa terkait mungkin terpengaruh.`}
        confirmText="Ya, Hapus"
        isDestructive={true}
      />
    </div>
  );
}
