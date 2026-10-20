"use client";

import { useEffect, useState } from "react";
import { TableRowsSkeleton } from "@/components/Skeletons";
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Building2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
  User,
} from "lucide-react";

export default function PenggunaAdminPage() {
  const [adminList, setAdminList] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [nama, setNama] = useState("");
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [scopeTarget, setScopeTarget] = useState("");
  const [fakultasList, setFakultasList] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [uRes, aRes, pRes, fRes, kRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/pengguna-admin"),
        fetch("/api/admin/prodi"),
        fetch("/api/admin/fakultas"),
        fetch("/api/admin/kelas"),
      ]);

      const uData = await uRes.json();
      const aData = await aRes.json();
      const pData = await pRes.json();
      const fData = await fRes.json();
      const kData = await kRes.json();

      setCurrentUser(uData.user);
      setAdminList(aData.data || []);
      setProdiList(pData.data || []);
      setFakultasList(fData.data || []);
      setKelasList(kData.data || []);
    } catch {
      setError("Gagal memuat data Admin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    let prodi_id = null;
    let fakultas = null;
    let managed_kelas_ids: string[] | null = null;

    if (role === "komting" || role === "bendahara") {
      if (selectedKelasIds.length === 0) {
        setError("Pilih minimal 1 kelas yang diawasi oleh Komting / Bendahara");
        setSubmitting(false);
        return;
      }
      managed_kelas_ids = selectedKelasIds;
    } else {
      if (scopeTarget.startsWith("prodi:")) {
        prodi_id = scopeTarget.replace("prodi:", "");
      } else if (scopeTarget.startsWith("fakultas:")) {
        fakultas = scopeTarget.replace("fakultas:", "");
      }
    }

    try {
      const res = await fetch("/api/admin/pengguna-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          nim,
          password,
          role,
          prodi_id,
          fakultas,
          managed_kelas_ids,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat akun");

      setSuccess(`Akun [${role.toUpperCase()}] ${nama} (${nim}) berhasil dibuat!`);
      setNama("");
      setNim("");
      setPassword("");
      setSelectedKelasIds([]);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async (id: string, namaAdmin: string) => {
    if (!confirm(`Hapus akun admin "${namaAdmin}"? Aksesnya ke sistem akan langsung dicabut.`)) return;

    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/pengguna-admin?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus admin");

      setSuccess(`Akun admin "${namaAdmin}" berhasil dihapus.`);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!loading && currentUser?.role !== "super_admin") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-sm bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-black dark:text-white">Akses Dibatasi</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">
          Hanya Super Admin yang berhak mengelola akun admin pengawas program studi.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sm bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold tracking-wider uppercase">
              SUPER ADMIN CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white mt-1">
            Kelola Akun Admin Prodi
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Buat akun Admin terbatas yang bertugas mengawasi kelas dan mahasiswa khusus di Program Studi tertentu.
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
        <div className="p-4 rounded-sm bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah Admin */}
        <div className="lg:col-span-1">
          <div className="border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-950 p-6">
            <h2 className="text-base font-bold text-black dark:text-white flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4" />
              Buat Akun Admin
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mb-6">
              Pilih Program Studi yang diawasi oleh admin ini. Admin hanya bisa mengakses data di prodinya saja.
            </p>

            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap Admin
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Budi Santoso, M.Kom"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Username / NIP
                </label>
                <input
                  type="text"
                  required
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  placeholder="Contoh: admin_ti atau 198801..."
                  className="w-full px-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Password Awal
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                  Role / Jabatan
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                >
                  <option value="admin">Admin Prodi / Dekan</option>
                  <option value="komting">Komting / Ketua Kelas</option>
                  <option value="bendahara">Bendahara Kelas</option>
                  <option value="super_admin">Super Admin (Akses Penuh Seluruh Kampus)</option>
                </select>
              </div>

              {role === "admin" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Wilayah Pengawasan (Fakultas / Prodi)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <select
                      value={scopeTarget}
                      onChange={(e) => setScopeTarget(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-sm border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    >
                      <option value="">-- Pilih Wilayah --</option>

                      {fakultasList.length > 0 && (
                        <optgroup label="Tingkat Fakultas (Dekan / Pengawas Fakultas)">
                          {fakultasList.map((f) => (
                            <option key={f.id} value={`fakultas:${f.nama}`}>
                              Dekan - {f.nama} ({f.kode})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {prodiList.length > 0 && (
                        <optgroup label="Tingkat Program Studi (Kaprodi / Admin Jurusan)">
                          {prodiList.map((p) => (
                            <option key={p.id} value={`prodi:${p.id}`}>
                              Kaprodi - {p.nama} ({p.kode})
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
              )}

              {(role === "komting" || role === "bendahara") && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1">
                    Kelas Yang Diawasi (Bisa Pilih 1 atau Beberapa Kelas)
                  </label>
                  <div className="border border-gray-200 dark:border-zinc-800 rounded-sm p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50/50 dark:bg-zinc-900/50">
                    {kelasList.length === 0 ? (
                      <span className="text-xs text-gray-400">Belum ada kelas yang dibuat.</span>
                    ) : (
                      kelasList.map((k) => {
                        const checked = selectedKelasIds.includes(k.id);
                        return (
                          <label
                            key={k.id}
                            className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-zinc-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-1.5 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedKelasIds([...selectedKelasIds, k.id]);
                                } else {
                                  setSelectedKelasIds(selectedKelasIds.filter((id) => id !== k.id));
                                }
                              }}
                              className="rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="font-bold">{k.nama}</span>
                            <span className="text-[10px] text-gray-400">({k.nama_prodi || "SI"} - {k.tahun_ajaran})</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1 block">
                    {selectedKelasIds.length} kelas dipilih untuk akun ini.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-sm bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                {submitting ? "Membuat Akun..." : "Buat Akun Admin"}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Akun Admin */}
        <div className="lg:col-span-2">
          <div className="border border-gray-200 dark:border-zinc-800 rounded-sm bg-white dark:bg-zinc-950 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white">
                  Daftar Admin Sistem
                </h3>
                <span className="text-xs text-gray-500 dark:text-zinc-400">
                  Total {adminList.length} Pengawas Aktif
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-6">
                <TableRowsSkeleton rows={4} />
              </div>
            ) : adminList.length === 0 ? (
              <div className="p-12 text-center text-sm text-gray-500 dark:text-zinc-400">
                Belum ada akun admin terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-900/50 text-[11px] uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Admin</th>
                      <th className="px-6 py-3 font-semibold">Role</th>
                      <th className="px-6 py-3 font-semibold">Wilayah Prodi</th>
                      <th className="px-6 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                    {adminList.map((a) => {
                      const isSuper = a.role === "super_admin";
                      const isMe = currentUser?.id === a.id;

                      return (
                        <tr key={a.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-black dark:text-white">
                                {a.nama}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded-full bg-black text-white dark:bg-white dark:text-black text-[9px] font-bold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-mono text-gray-400 dark:text-zinc-500">
                              @{a.nim}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-bold tracking-wider uppercase border ${
                                isSuper
                                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                                  : a.role === "komting"
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                  : a.role === "bendahara"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                  : "bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300 border-gray-200 dark:border-zinc-700"
                              }`}
                            >
                              {isSuper
                                ? "Super Admin"
                                : a.role === "komting"
                                ? "Komting"
                                : a.role === "bendahara"
                                ? "Bendahara"
                                : a.fakultas
                                ? "Dekan"
                                : "Admin Prodi"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span className="font-medium text-black dark:text-white">
                                {a.nama_prodi}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isMe && (
                              <button
                                onClick={() => handleDeleteAdmin(a.id, a.nama)}
                                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                                title="Cabut Akses Admin"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
