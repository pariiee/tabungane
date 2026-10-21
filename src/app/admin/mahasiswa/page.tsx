"use client";

import { useEffect, useState } from "react";
import CustomSelect from "@/components/CustomSelect";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Users,
  UserPlus,
  Upload,
  KeyRound,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Wallet,
  RefreshCw,
  Pencil,
  Trash2,
  ShieldCheck,
  X
} from "lucide-react";

export default function AdminMahasiswaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterKelas, setFilterKelas] = useState("");

  // Modal / Form Tambah Mahasiswa
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNim, setNewNim] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKelasId, setNewKelasId] = useState("");

  // Modal Import CSV
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  // Modal Tambah Saldo Manual (M4 PRD)
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [targetGrupId, setTargetGrupId] = useState("");
  const [nominalManual, setNominalManual] = useState("");
  const [catatanManual, setCatatanManual] = useState("");

  // Modal Edit / Pindah Kelas
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editNama, setEditNama] = useState("");
  const [editKelasId, setEditKelasId] = useState("");
  const [editAktif, setEditAktif] = useState(true);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal Hapus Mahasiswa
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [resetTarget, setResetTarget] = useState<any>(null);

  // Success / Temp Password Alert
  const [alertInfo, setAlertInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const loadData = () => {
    fetch(`/api/admin/mahasiswa${filterKelas ? `?kelas_id=${filterKelas}` : ""}`)
      .then((res) => res.json())
      .then((d) => setStudents(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => setKelasList(d.data || []));

    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [filterKelas]);

  // Tambah Mahasiswa Manual
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/mahasiswa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim: newNim, nama: newNama, kelas_id: newKelasId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah mahasiswa");

      setAlertInfo({
        title: "Mahasiswa Berhasil Ditambahkan",
        message: `NIM: ${data.nim} | Nama: ${data.nama}`,
        tempPassword: data.temp_password,
      });

      setShowAddModal(false);
      setNewNim("");
      setNewNama("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Import CSV
  const handleImportCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/mahasiswa/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal impor CSV");

      setAlertInfo({
        title: "Impor CSV Selesai",
        message: `Berhasil memproses ${data.total} baris. (${data.created} akun baru dibuat). Password sementara bawaan: pwd123456`,
      });

      setShowCsvModal(false);
      setCsvText("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Reset Password
  const handleResetPassword = async (student: any) => {
    try {
      const res = await fetch("/api/admin/mahasiswa/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: student.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset password");

      setAlertInfo({
        title: "Password Berhasil Direset",
        message: `Password sementara untuk NIM ${data.nim} (${data.nama}):`,
        tempPassword: data.temp_password,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Tambah Saldo Manual (M4)
  const handleManualSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/admin/transaksi/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedStudent.id,
          grup_id: targetGrupId,
          jumlah: parseInt(nominalManual, 10),
          catatan: catatanManual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambah saldo manual");

      setAlertInfo({
        title: "Setoran Saldo Berhasil Dicatat",
        message: `Nominal Rp${parseInt(nominalManual, 10).toLocaleString("id-ID")} berhasil ditambahkan ke ${selectedStudent.nama}`,
      });

      setShowSaldoModal(false);
      setNominalManual("");
      setCatatanManual("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Edit / Pindah Kelas
  const handleOpenEdit = (s: any) => {
    setEditStudent(s);
    setEditNama(s.nama);
    setEditKelasId(s.kelas_id || "");
    setEditAktif(s.aktif !== 0);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setError("");
    setSubmittingEdit(true);
    try {
      const res = await fetch("/api/admin/mahasiswa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editStudent.id,
          nama: editNama,
          kelas_id: editKelasId,
          aktif: editAktif,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupdate mahasiswa");

      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Hapus Mahasiswa
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    setSubmittingDelete(true);
    try {
      const res = await fetch(`/api/admin/mahasiswa?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus mahasiswa");

      if (data.action === "deactivated") {
        setAlertInfo({
          title: "Akun Dinonaktifkan",
          detail: data.message,
        });
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Toggle Role Mahasiswa <-> Adminya Kelas
  const handleToggleAdminKelas = async (s: any) => {
    const isNowAdmin = s.role === "admin_kelas";
    const newRole = isNowAdmin ? "mahasiswa" : "admin_kelas";
    const label = isNowAdmin ? "turunkan ke Mahasiswa biasa" : "angkat menjadi Adminya Kelas";

    if (!confirm(`Apakah Anda yakin ingin ${label} untuk "${s.nama}"?`)) return;

    try {
      setError("");
      const res = await fetch("/api/admin/mahasiswa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
            <span>Kelola Mahasiswa</span>
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Data mahasiswa per kelas, reset password, dan input setoran tunai manual.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="h-9 px-3.5 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Tambah Mahasiswa</span>
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor CSV</span>
          </button>
        </div>
      </div>

      {/* Info Alert (Password Sementara) */}
      {alertInfo && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">{alertInfo.title}</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">{alertInfo.message}</p>
            {alertInfo.tempPassword && (
              <div className="mt-2 p-2 bg-white dark:bg-zinc-900 rounded-md border border-emerald-300 dark:border-emerald-700 inline-block font-mono font-bold text-xs text-emerald-800 dark:text-emerald-200">
                Password Sementara: {alertInfo.tempPassword}
              </div>
            )}
          </div>
          <button
            onClick={() => setAlertInfo(null)}
            className="text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 dark:text-zinc-400">Filter Kelas:</label>
        <div className="w-56">
          <CustomSelect
            value={filterKelas}
            onChange={setFilterKelas}
            placeholder="Semua Kelas"
            options={[
              { value: "", label: "Semua Kelas" },
              ...kelasList.map((k) => ({
                value: k.id,
                label: `${k.nama} (${k.tahun_ajaran})`,
              })),
            ]}
          />
        </div>
        <span className="text-xs text-gray-400 dark:text-zinc-500 ml-auto">{students.length} Mahasiswa ditemukan</span>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/70 dark:bg-zinc-900/40 text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800/60">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Status Password</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-zinc-100">{s.nomor_id || s.nim}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-zinc-100">
                    <div className="flex items-center gap-1.5">
                      <span>{s.nama}</span>
                      {s.role === "admin_kelas" && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-800/40">
                          Adminya Kelas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium px-2 py-0.5 rounded-full text-[10px]">
                      {s.nama_kelas || "Tanpa Kelas"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    {s.aktif === 0 ? (
                      <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Nonaktif
                      </span>
                    ) : s.must_change_password ? (
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Wajib Ganti
                      </span>
                    ) : (
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
                        Aktif
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleAdminKelas(s)}
                      className={`px-2 py-1 text-[11px] font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer border ${
                        s.role === "admin_kelas"
                          ? "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/40"
                          : "border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300"
                      }`}
                      title={s.role === "admin_kelas" ? "Turunkan ke Mahasiswa Biasa" : "Angkat Jadi Adminya Kelas"}
                    >
                      <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{s.role === "admin_kelas" ? "Turunkan Role" : "Admin Kelas"}</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStudent(s);
                        if (groups.length > 0) setTargetGrupId(groups[0].id);
                        setShowSaldoModal(true);
                      }}
                      className="px-2 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Setor Saldo Tunai"
                    >
                      <Wallet className="w-3 h-3" />
                      <span>Setor</span>
                    </button>
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="px-2 py-1 text-[11px] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Edit Nama / Pindah Kelas"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setResetTarget(s)}
                      className="px-2 py-1 text-[11px] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(s)}
                      className="px-2 py-1 text-[11px] border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Hapus / Nonaktifkan Mahasiswa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah Mahasiswa */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Tambah Mahasiswa Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">ID Pengguna</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 240102"
                  value={newNim}
                  onChange={(e) => setNewNim(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Nama Mahasiswa</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Pilih Kelas</label>
                <CustomSelect
                  value={newKelasId}
                  onChange={setNewKelasId}
                  placeholder="-- Pilih Kelas --"
                  options={[
                    { value: "", label: "-- Pilih Kelas --" },
                    ...kelasList.map((k) => ({
                      value: k.id,
                      label: `${k.nama} (${k.tahun_ajaran})`,
                    })),
                  ]}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs"
                >
                  Simpan Mahasiswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Impor Data Mahasiswa via CSV</h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Format per baris: <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">NIM,Nama Mahasiswa,Nama Kelas</code>
                </p>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportCsv} className="space-y-3">
              <div>
                <textarea
                  rows={8}
                  required
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`nim,nama,kelas\n240103,Ahmad Fauzi,3A\n240104,Siti Nurhaliza,3A\n240105,Rian Pratama,3B`}
                  className="w-full p-3 font-mono text-xs border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCsvModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs"
                >
                  Mulai Impor CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Saldo Manual (M4) */}
      {showSaldoModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Tambah Saldo Manual (Setoran Tunai)</h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Untuk: <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedStudent.nama}</span> ({selectedStudent.nim})
                </p>
              </div>
              <button onClick={() => setShowSaldoModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSaldo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Pilih Event Sakune</label>
                <CustomSelect
                  value={targetGrupId}
                  onChange={setTargetGrupId}
                  options={groups.map((g) => ({
                    value: g.id,
                    label: `${g.nama} (${g.nama_kelas})`,
                  }))}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  placeholder="Contoh: 50000"
                  value={nominalManual}
                  onChange={(e) => setNominalManual(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Catatan Wajib
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Setor tunai ke bendahara"
                  value={catatanManual}
                  onChange={(e) => setCatatanManual(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaldoModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs"
                >
                  Simpan Setoran Tunai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Pindah Kelas */}
      {showEditModal && editStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Edit Data Mahasiswa</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">ID: {editStudent.nim}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Mahasiswa
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
                  Kelas Perkuliahan (Pindah Kelas)
                </label>
                <CustomSelect
                  value={editKelasId}
                  onChange={setEditKelasId}
                  placeholder="Pilih Kelas"
                  options={[
                    { value: "", label: "Pilih Kelas" },
                    ...kelasList.map((k) => ({
                      value: k.id,
                      label: `Kelas ${k.nama} (${k.tahun_ajaran})`,
                    })),
                  ]}
                />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                  Pindah kelas akan otomatis mengikutsertakan mahasiswa ke event tabungan aktif kelas baru.
                </p>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editAktif}
                    onChange={(e) => setEditAktif(e.target.checked)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span>Status Akun Aktif (Bisa Login & Ikut Event)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  {submittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus / Nonaktifkan */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus / Nonaktifkan</span>
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 dark:text-zinc-400">
              Apakah Anda yakin ingin menghapus mahasiswa <span className="font-bold text-black dark:text-white">{deleteTarget.nama}</span> ({deleteTarget.nim})?
            </p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800">
              Jika mahasiswa sudah memiliki catatan transaksi, akun akan otomatis dinonaktifkan agar rekam jejak ledger tetap terjaga.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium shadow-xs disabled:opacity-50"
              >
                {submittingDelete ? "Memproses..." : "Ya, Hapus / Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        onConfirm={() => {
          if (resetTarget) handleResetPassword(resetTarget);
        }}
        title="Reset Password Mahasiswa?"
        message={`Reset password untuk ${resetTarget?.nama} (${resetTarget?.nim})? Sistem akan menghasilkan kata sandi baru secara acak.`}
        confirmText="Ya, Reset Password"
        isDestructive={false}
      />
    </div>
  );
}
