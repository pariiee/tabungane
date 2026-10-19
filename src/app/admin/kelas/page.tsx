"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2, Users, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminKelasPage() {
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [tahunAjaran, setTahunAjaran] = useState("2026/2027");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = () => {
    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => {
        setKelasList(d.data || []);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama, tahun_ajaran: tahunAjaran }),
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
    if (!confirm(`Hapus kelas ${namaKelas}? Data mahasiswa terkait mungkin terpengaruh.`)) return;

    try {
      const res = await fetch(`/api/admin/kelas?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-purple-600" />
          Kelola Kelas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Daftar kelas perkuliahan beserta tahun ajaran untuk pengelompokan mahasiswa dan grup tabungan.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Tambah Kelas */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-purple-600" />
          Tambah Kelas Baru
        </h2>
        <form onSubmit={handleAddKelas} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Kelas</label>
            <input
              type="text"
              required
              placeholder="Contoh: 3A atau 4B"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tahun Ajaran</label>
            <input
              type="text"
              required
              placeholder="2026/2027"
              value={tahunAjaran}
              onChange={(e) => setTahunAjaran(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Kelas"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Kelas */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Daftar Kelas Aktif</h2>
          <span className="text-xs text-gray-400">{kelasList.length} kelas terdaftar</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4">Tahun Ajaran</th>
                <th className="py-3 px-4">Jumlah Mahasiswa</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                    Memuat daftar kelas...
                  </td>
                </tr>
              ) : kelasList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-xs text-gray-400">
                    Belum ada kelas yang dibuat.
                  </td>
                </tr>
              ) : (
                kelasList.map((k) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{k.nama}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">{k.tahun_ajaran}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                        <Users className="w-3 h-3" />
                        {k.jumlah_mahasiswa} Mahasiswa
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteKelas(k.id, k.nama)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
