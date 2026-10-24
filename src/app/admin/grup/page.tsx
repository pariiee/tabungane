"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomSelect from "@/components/CustomSelect";
import { Layers, Plus, Calendar, Target, Users, Wallet, ArrowRight, AlertCircle, CheckCircle2, RefreshCw, X, Pencil } from "lucide-react";

export default function AdminGrupPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Buat Event
  const [showModal, setShowModal] = useState(false);
  const [namaGrup, setNamaGrup] = useState("");
  const [kelasId, setKelasId] = useState("all");
  const [targetPerMhs, setTargetPerMhs] = useState("100000");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form Edit Event
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [editNama, setEditNama] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editStatus, setEditStatus] = useState("aktif");
  const [editing, setEditing] = useState(false);

  const handleOpenEdit = (g: any) => {
    setSelectedGroup(g);
    setEditNama(g.nama || "");
    setEditTarget(String(g.target_per_mahasiswa || 0));
    setEditDeadline(g.deadline || "");
    setEditStatus(g.status || "aktif");
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setError("");
    setSuccess("");
    setEditing(true);

    try {
      const res = await fetch("/api/admin/grup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedGroup.id,
          nama: editNama,
          target_per_mahasiswa: parseInt(editTarget, 10),
          deadline: editDeadline,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengedit event");

      setSuccess(`Event "${editNama}" berhasil diperbarui!`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const loadData = () => {
    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => {
        const k = d.data || [];
        setKelasList(k);
      });

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setDeadline(d.toISOString().split("T")[0]);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/grup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelas_id: kelasId,
          nama: namaGrup,
          target_per_mahasiswa: parseInt(targetPerMhs, 10),
          deadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat event");

      setSuccess(`Event Sakune "${namaGrup}" berhasil dibuat! Otomatis mendaftarkan ${data.total_enrolled} mahasiswa.`);
      setShowModal(false);
      setNamaGrup("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Event Sakune</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Kelola event tabungan per kelas atau event terbuka untuk semua kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="h-9 px-3.5 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Event Baru</span>
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

      {/* Grid Event */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div
            key={g.id}
            className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs space-y-4 hover:border-gray-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  g.nama_kelas === "Semua Kelas"
                    ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                }`}>
                  {g.nama_kelas === "Semua Kelas" ? "Semua Kelas (Terbuka)" : `Kelas ${g.nama_kelas}`}
                </span>
                <span className="text-[11px] text-gray-400 dark:text-zinc-500">Deadline: {g.deadline}</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm mt-2">{g.nama}</h3>
            </div>

            <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-zinc-800/50 text-xs">
              <div className="flex justify-between text-gray-500 dark:text-zinc-400 text-[11px]">
                <span>Target Iuran per Mhs:</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">
                  Rp {g.target_per_mahasiswa?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-zinc-400 text-[11px]">
                <span>Total Dana Terkumpul:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Rp {g.total_terkumpul?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-gray-500 dark:text-zinc-400 text-[11px]">
                <span>Peserta Terdaftar:</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{g.total_anggota} Mahasiswa</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between">
              <Link
                href={`/grup/${g.id}`}
                className="text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-black dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Leaderboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(g)}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Edit Event"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <Link
                  href={`/admin/laporan?grup_id=${g.id}`}
                  className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 underline"
                >
                  Laporan
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Buat Event */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Buat Event Sakune Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Target Event
                </label>
                <CustomSelect
                  value={kelasId}
                  onChange={setKelasId}
                  options={[
                    { value: "all", label: "Semua Kelas (Terbuka / Lintas Angkatan)" },
                    ...kelasList.map((k) => ({
                      value: k.id,
                      label: `Kelas ${k.nama} (${k.tahun_ajaran})`,
                    })),
                  ]}
                />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                  Pilih "Semua Kelas" untuk mengikutsertakan seluruh mahasiswa aktif secara otomatis.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Event Sakune
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kas Wisuda 2026 / Patungan Buka Bersama"
                  value={namaGrup}
                  onChange={(e) => setNamaGrup(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Target Nominal per Mahasiswa (Rp)
                </label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={targetPerMhs}
                  onChange={(e) => setTargetPerMhs(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs"
                >
                  {submitting ? "Membuat..." : "Simpan Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Event */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Edit Event Sakune</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateGroup} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Event
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Target Iuran per Mahasiswa (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Tenggat Waktu (Deadline)
                </label>
                <input
                  type="date"
                  required
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Status Event
                </label>
                <CustomSelect
                  value={editStatus}
                  onChange={setEditStatus}
                  options={[
                    { value: "aktif", label: "Aktif (Menerima Setoran)" },
                    { value: "selesai", label: "Selesai (Ditutup)" },
                  ]}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs cursor-pointer"
                >
                  {editing ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
