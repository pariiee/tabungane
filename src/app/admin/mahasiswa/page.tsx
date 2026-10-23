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
  Search,
  X
} from "lucide-react";

export default function AdminMahasiswaPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [filterKelas, setFilterKelas] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const idMatch = String(s.nomor_id || s.nim || "").toLowerCase().includes(q);
    const nameMatch = String(s.nama || "").toLowerCase().includes(q);
    const usernameMatch = String(s.username || "").toLowerCase().includes(q);
    return idMatch || nameMatch || usernameMatch;
  });

  // Modal / Form Tambah Mahasiswa
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNim, setNewNim] = useState("");
  const [newNama, setNewNama] = useState("");
  const [newKelasId, setNewKelasId] = useState("");

  // Modal Import CSV
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState("");

  // Modal Kelola Saldo (Tambah / Kurang Saldo)
  const [showSaldoModal, setShowSaldoModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [targetTujuan, setTargetTujuan] = useState("dompet_utama");
  const [jenisAksi, setJenisAksi] = useState<"tambah" | "kurang">("tambah");
  const [destinasiList, setDestinasiList] = useState<{
    student: any;
    dompet: any;
    kantong: any[];
    events: any[];
  } | null>(null);
  const [loadingDestinasi, setLoadingDestinasi] = useState(false);
  const [nominalManual, setNominalManual] = useState("");
  const [catatanManual, setCatatanManual] = useState("");

  // Modal Edit Mahasiswa (ID, Nama, Fakultas, Prodi, Kelas, Permissions)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [editNomorId, setEditNomorId] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editFakultas, setEditFakultas] = useState("");
  const [editProdiId, setEditProdiId] = useState("");
  const [editKelasId, setEditKelasId] = useState("");
  const [editAktif, setEditAktif] = useState(true);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Master Data Fakultas & Prodi
  const [fakultasList, setFakultasList] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);

  // Modal Hapus Mahasiswa
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [resetTarget, setResetTarget] = useState<any>(null);
  const [roleToggleTarget, setRoleToggleTarget] = useState<any>(null);

  // Success / Temp Password Alert
  const [alertInfo, setAlertInfo] = useState<any>(null);
  const [error, setError] = useState("");

  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdminKelas = currentUser?.role === "admin_kelas";
  const isKaprodi = currentUser?.role === "admin" && Boolean(currentUser?.prodi_id);
  const isDekan = currentUser?.role === "admin" && Boolean(currentUser?.fakultas) && !currentUser?.prodi_id;

  const canUserDo = (u: any, perm: string): boolean => {
    if (!u) return false;
    if (u.role === "super_admin") return true;
    if (u.custom_permissions) {
      try {
        const p = typeof u.custom_permissions === "string" ? JSON.parse(u.custom_permissions) : u.custom_permissions;
        if (Array.isArray(p)) return p.includes(perm);
        if (typeof p === "object" && p !== null && typeof p[perm] === "boolean") return p[perm];
      } catch {}
    }
    if (u.role === "admin_kelas") return perm === "manage_saldo";
    if (u.role === "admin") return ["manage_saldo", "edit_mahasiswa", "reset_mahasiswa", "manage_event"].includes(perm);
    return false;
  };

  const loadData = () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((d) => setCurrentUser(d.user))
      .catch(() => {});

    fetch(`/api/admin/mahasiswa${filterKelas ? `?kelas_id=${filterKelas}` : ""}`)
      .then((res) => res.json())
      .then((d) => setStudents(d.data || []));

    fetch("/api/admin/kelas")
      .then((res) => res.json())
      .then((d) => setKelasList(d.data || []));

    fetch("/api/admin/grup")
      .then((res) => res.json())
      .then((d) => setGroups(d.data || []));

    fetch("/api/admin/fakultas")
      .then((res) => res.json())
      .then((d) => setFakultasList(d.data || []))
      .catch(() => {});

    fetch("/api/admin/prodi")
      .then((res) => res.json())
      .then((d) => setProdiList(d.data || []))
      .catch(() => {});

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

  // Reset Password & Username ke ID Mahasiswa
  const handleResetPassword = async (student: any) => {
    try {
      const res = await fetch("/api/admin/mahasiswa/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: student.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset akun");

      setAlertInfo({
        title: "Akun Berhasil Direset",
        message: `Username & Password login baru telah disetel ke ID:`,
        tempPassword: data.temp_password,
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Buka Modal Kelola Saldo (Tambah / Kurang Saldo)
  const handleOpenSaldo = async (s: any) => {
    setSelectedStudent(s);
    setJenisAksi("tambah");
    setTargetTujuan("dompet_utama");
    setNominalManual("");
    setCatatanManual("");
    setShowSaldoModal(true);
    setLoadingDestinasi(true);
    try {
      const res = await fetch(`/api/admin/mahasiswa/destinasi?user_id=${s.id}`);
      const d = await res.json();
      setDestinasiList(d);
    } catch {
      setDestinasiList(null);
    } finally {
      setLoadingDestinasi(false);
    }
  };

  // Submit Saldo Manual (Tambah / Kurang Saldo)
  const handleManualSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError("");
    try {
      const res = await fetch("/api/admin/transaksi/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedStudent.id,
          target_tujuan: targetTujuan,
          jenis_aksi: jenisAksi,
          jumlah: parseInt(nominalManual, 10),
          catatan: catatanManual,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses transaksi saldo");

      setAlertInfo({
        title: jenisAksi === "tambah" ? "Saldo Berhasil Ditambahkan" : "Saldo Berhasil Dikurangi",
        message: data.message || `Rp ${parseInt(nominalManual, 10).toLocaleString("id-ID")} untuk ${selectedStudent.nama}`,
      });

      setShowSaldoModal(false);
      setNominalManual("");
      setCatatanManual("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Edit Data Mahasiswa Lengkap (ID, Nama, Fakultas, Prodi, Kelas)
  const handleOpenEdit = (s: any) => {
    setEditStudent(s);
    setEditNomorId(s.nomor_id || s.nim || "");
    setEditNama(s.nama || "");
    setEditFakultas(s.fakultas || s.nama_fakultas || "");
    setEditProdiId(s.prodi_id || "");
    setEditKelasId(s.kelas_id || "");
    setEditAktif(s.aktif !== 0);
    try {
      const raw = s.custom_permissions;
      const p = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
      setEditPermissions(Array.isArray(p) ? p : []);
    } catch {
      setEditPermissions([]);
    }
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
          nomor_id: editNomorId,
          nama: editNama,
          fakultas: editFakultas,
          prodi_id: editProdiId,
          kelas_id: editKelasId,
          aktif: editAktif,
          custom_permissions: editPermissions,
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
  const handleConfirmToggleRole = async () => {
    if (!roleToggleTarget) return;
    const isNowAdmin = roleToggleTarget.role === "admin_kelas";
    const newRole = isNowAdmin ? "mahasiswa" : "admin_kelas";

    try {
      setError("");
      const res = await fetch("/api/admin/mahasiswa", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roleToggleTarget.id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah role");
      setRoleToggleTarget(null);
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

        {!isAdminKelas && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="h-9 px-3.5 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Tambah Mahasiswa</span>
            </button>
            <button
              onClick={() => setShowCsvModal(true)}
              className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg text-xs font-medium shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Impor CSV</span>
            </button>
          </div>
        )}
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

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#111113] p-4 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari ID / NIM atau Nama Mahasiswa..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50/70 dark:bg-zinc-900/60 border border-gray-200/80 dark:border-zinc-800 text-xs rounded-xl focus:outline-hidden focus:ring-1 focus:ring-gray-400 dark:focus:ring-zinc-600 transition-all text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 shrink-0">Kelas:</label>
          <div className="w-48 sm:w-56">
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
        </div>
        <span className="text-xs text-gray-400 dark:text-zinc-500 sm:ml-auto shrink-0">
          {filteredStudents.length} Mahasiswa ditemukan
        </span>
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
                <th className="py-3 px-4">Saldo Saku</th>
                <th className="py-3 px-4">Status Password</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {filteredStudents.map((s) => (
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
                  <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                    <span className={`text-xs ${Number(s.saldo_dompet || 0) > 0 ? "font-bold text-emerald-600 dark:text-emerald-400" : "font-medium text-gray-400 dark:text-zinc-500"}`}>
                      Rp {Number(s.saldo_dompet || 0).toLocaleString("id-ID")}
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
                    {/* Aksi Saldo: Muncul jika memiliki izin manage_saldo */}
                    {canUserDo(currentUser, "manage_saldo") && (
                      <button
                        onClick={() => handleOpenSaldo(s)}
                        className="px-2 py-1 text-[11px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Kelola Saldo (Setoran Tunai / Pengurangan)"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Saldo</span>
                      </button>
                    )}

                    {/* Promosi / Demote Admin Kelas: Hanya Super Admin & Kaprodi */}
                    {(isSuperAdmin || isKaprodi) && (
                      <button
                        onClick={() => setRoleToggleTarget(s)}
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
                    )}

                    {/* Edit Mahasiswa: Muncul jika memiliki izin edit_mahasiswa */}
                    {canUserDo(currentUser, "edit_mahasiswa") && (
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="px-2 py-1 text-[11px] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Edit Data Mahasiswa"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}

                    {/* Reset Password: Muncul jika memiliki izin reset_mahasiswa */}
                    {canUserDo(currentUser, "reset_mahasiswa") && (
                      <button
                        onClick={() => setResetTarget(s)}
                        className="px-2 py-1 text-[11px] border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Reset Password & Username ke ID"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}

                    {/* Hapus Mahasiswa: Hanya Super Admin atau yang memiliki izin hapus_mahasiswa */}
                    {(isSuperAdmin || canUserDo(currentUser, "hapus_mahasiswa")) && (
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="px-2 py-1 text-[11px] border border-rose-200/60 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-medium rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title="Hapus / Nonaktifkan Mahasiswa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400 dark:text-zinc-500 text-xs">
                    {searchQuery ? `Tidak ada mahasiswa yang cocok dengan "${searchQuery}"` : "Belum ada data mahasiswa"}
                  </td>
                </tr>
              )}
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

      {/* Modal Kelola Saldo (Tambah / Kurang Saldo) */}
      {showSaldoModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Kelola Saldo Mahasiswa</h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Untuk: <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedStudent.nama}</span> ({selectedStudent.nomor_id || selectedStudent.nim})
                </p>
              </div>
              <button onClick={() => setShowSaldoModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toggle Tambah / Kurang Saldo */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setJenisAksi("tambah")}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  jenisAksi === "tambah"
                    ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
                }`}
              >
                + Tambah Saldo
              </button>
              <button
                type="button"
                onClick={() => setJenisAksi("kurang")}
                className={`py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  jenisAksi === "kurang"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
                }`}
              >
                - Kurangi Saldo
              </button>
            </div>

            <form onSubmit={handleManualSaldo} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Pilih Tujuan Kantong / Saldo
                </label>
                {loadingDestinasi ? (
                  <div className="h-9 flex items-center px-3 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs text-gray-400">
                    Memuat pos kantong...
                  </div>
                ) : (
                  <CustomSelect
                    value={targetTujuan}
                    onChange={setTargetTujuan}
                    options={[
                      {
                        value: "dompet_utama",
                        label: `Kantong Utama (Dompet) — Rp ${(destinasiList?.dompet?.saldo || 0).toLocaleString("id-ID")}`,
                      },
                      ...(destinasiList?.kantong || []).map((k) => ({
                        value: k.id,
                        label: `${k.nama} — Rp ${(k.saldo || 0).toLocaleString("id-ID")}`,
                      })),
                      ...(destinasiList?.events || []).map((e) => ({
                        value: e.id,
                        label: `${e.nama} — Rp ${(e.saldo || 0).toLocaleString("id-ID")}`,
                      })),
                    ]}
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nominal {jenisAksi === "tambah" ? "Setoran / Penambahan" : "Pengurangan"} (Rp)
                </label>
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
                  placeholder={jenisAksi === "tambah" ? "Contoh: Setor tunai ke bendahara" : "Contoh: Penyesuaian koreksi saldo"}
                  value={catatanManual}
                  onChange={(e) => setCatatanManual(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaldoModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`h-9 px-4 rounded-lg text-xs font-medium shadow-xs text-white cursor-pointer ${
                    jenisAksi === "kurang"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-gray-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900"
                  }`}
                >
                  {jenisAksi === "tambah" ? "Simpan Penambahan" : "Simpan Pengurangan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Data Mahasiswa Lengkap (ID, Nama, Fakultas, Prodi, Kelas) */}
      {showEditModal && editStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Edit Data Mahasiswa</h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Ubah ID, nama, fakultas, prodi, dan kelas</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  ID Pengguna (NIM / Identitas)
                </label>
                <input
                  type="text"
                  required
                  value={editNomorId}
                  onChange={(e) => setEditNomorId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Nama Lengkap Mahasiswa
                </label>
                <input
                  type="text"
                  required
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Pilihan Fakultas: HANYA untuk Super Admin */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Fakultas
                  </label>
                  <CustomSelect
                    value={editFakultas}
                    onChange={setEditFakultas}
                    placeholder="Pilih Fakultas"
                    options={[
                      { value: "", label: "Pilih Fakultas (Umum / Belum Ditentukan)" },
                      ...fakultasList.map((f) => ({
                        value: f.nama,
                        label: `${f.nama} (${f.kode})`,
                      })),
                    ]}
                  />
                </div>
              )}

              {/* Pilihan Program Studi: HANYA untuk Super Admin & Dekan (Kaprodi tidak bisa ubah prodi) */}
              {(isSuperAdmin || isDekan) && (
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                    Program Studi (Prodi)
                  </label>
                  <CustomSelect
                    value={editProdiId}
                    onChange={setEditProdiId}
                    placeholder="Pilih Program Studi"
                    options={[
                      { value: "", label: "Pilih Program Studi (Umum / Bebas)" },
                      ...prodiList.map((p) => ({
                        value: p.id,
                        label: `${p.nama} (${p.kode})`,
                      })),
                    ]}
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Kelas Perkuliahan
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

              {/* Hak Akses Granular Mandiri (Bisa Diberikan ke Mahasiswa / Admin Kelas) */}
              {(isSuperAdmin || isKaprodi) && (
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                  <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                    Hak Akses Granular Tambahan
                  </label>
                  <div className="space-y-1.5 bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-gray-200 dark:border-zinc-800">
                    {[
                      { key: "manage_saldo", label: "Kelola Saldo (+/- Setoran & Koreksi)" },
                      { key: "edit_mahasiswa", label: "Edit Profil & Pindah Kelas" },
                      { key: "reset_mahasiswa", label: "Reset Password Mahasiswa" },
                      { key: "manage_event", label: "Kelola Event Sakune Kelas" },
                      { key: "approve_withdraw", label: "Verifikasi Pengajuan Tarik Saldo" },
                    ].map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={editPermissions.includes(perm.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditPermissions([...editPermissions, perm.key]);
                            } else {
                              setEditPermissions(editPermissions.filter((k) => k !== perm.key));
                            }
                          }}
                          className="rounded border-gray-300 text-black focus:ring-black"
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs cursor-pointer disabled:opacity-50"
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
        title="Reset Akun Mahasiswa?"
        message={`Reset akun untuk ${resetTarget?.nama} (${resetTarget?.nomor_id || resetTarget?.nim})? Username dan password akan disetel kembali menjadi ID Pengguna (${resetTarget?.nomor_id || resetTarget?.nim}) agar mahasiswa login sangat mudah.`}
        confirmText="Ya, Reset Akun"
        isDestructive={false}
      />

      <ConfirmModal
        isOpen={Boolean(roleToggleTarget)}
        onClose={() => setRoleToggleTarget(null)}
        onConfirm={handleConfirmToggleRole}
        title={roleToggleTarget?.role === "admin_kelas" ? "Turunkan Role Mahasiswa?" : "Angkat Jadi Adminya Kelas?"}
        message={
          roleToggleTarget?.role === "admin_kelas"
            ? `Apakah Anda yakin ingin menurunkan "${roleToggleTarget?.nama}" kembali menjadi Mahasiswa biasa? Hak akses kelola kelas akan dicabut.`
            : `Apakah Anda yakin ingin mengangkat "${roleToggleTarget?.nama}" menjadi Adminya Kelas? Siswa ini akan memiliki wewenang kelola kelas bersangkutan.`
        }
        confirmText={roleToggleTarget?.role === "admin_kelas" ? "Ya, Turunkan Role" : "Ya, Angkat Jadi Admin"}
        isDestructive={roleToggleTarget?.role === "admin_kelas"}
      />
    </div>
  );
}
