"use client";

import { useEffect, useState } from "react";
import { ProfileSkeleton } from "@/components/Skeletons";
import {
  User,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Copy,
  Check,
  CreditCard,
  Building2,
  Landmark,
  GraduationCap,
  AtSign,
  Pencil,
  X,
  Lock,
  Wifi,
  Terminal,
  ShieldCheck,
  Server,
  Layers,
} from "lucide-react";

export default function AkunPage() {
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Username edit modal state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  // ID / NIM edit modal state (Khusus Admin)
  const [isEditingId, setIsEditingId] = useState(false);
  const [idInput, setIdInput] = useState("");
  const [savingId, setSavingId] = useState(false);
  const [idError, setIdError] = useState("");
  const [idSuccess, setIdSuccess] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Photo profile upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Virtual Wallet Card State & Sensor Saldo (Khusus role yang punya wallet)
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showCardBalance, setShowCardBalance] = useState(true);
  const [copiedID, setCopiedID] = useState(false);

  const formatCardNumber = (nomorId: string = "") => {
    const clean = nomorId.replace(/\D/g, "");
    if (!clean) return "2405 •••• •••• 9999";
    const last4 = clean.slice(-4).padStart(4, "0");
    return `2405  ••••  ••••  ${last4}`;
  };

  const loadUserData = () => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/student/wallet").then((res) => res.json()).catch(() => ({})),
    ])
      .then(([userData, walletData]) => {
        if (userData.user) {
          setUser(userData.user);
          setUsernameInput(userData.user.username || "");
          setShowCardBalance(Boolean(userData.user.tampilkan_saldo_leaderboard));
        }
        if (typeof walletData.balance === "number") {
          setWallet(walletData);
        }
      })
      .finally(() => {
        setPageLoading(false);
      });
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError("");
    setPhotoSuccess("");

    if (file.size > 50 * 1024) {
      setPhotoError("Ukuran file foto maksimal 50 KB.");
      e.target.value = "";
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("/api/auth/me/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto profil");

      setUser((prev: any) => ({ ...prev, foto_url: data.foto_url }));
      setPhotoSuccess("Foto profil berhasil diperbarui!");
      setTimeout(() => setPhotoSuccess(""), 3000);
    } catch (err: any) {
      setPhotoError(err.message);
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const confirmPhotoDelete = async () => {
    setShowDeleteModal(false);
    setPhotoError("");
    setPhotoSuccess("");
    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/auth/me/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus foto");

      setUser((prev: any) => ({ ...prev, foto_url: null }));
      setPhotoSuccess("Foto profil berhasil dihapus.");
      setTimeout(() => setPhotoSuccess(""), 3000);
    } catch (err: any) {
      setPhotoError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");
    setSavingUsername(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah username");

      setUser(data.user);
      setIsEditingUsername(false);
      setUsernameSuccess("Username berhasil disimpan!");
      setTimeout(() => setUsernameSuccess(""), 3000);
    } catch (err: any) {
      setUsernameError(err.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSaveId = async (e: React.FormEvent) => {
    e.preventDefault();
    setIdError("");
    setIdSuccess("");
    setSavingId(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nomor_id: idInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah ID");

      setUser(data.user);
      setIsEditingId(false);
      setIdSuccess("ID berhasil disimpan!");
      setTimeout(() => setIdSuccess(""), 3000);
    } catch (err: any) {
      setIdError(err.message);
    } finally {
      setSavingId(false);
    }
  };

  const handleToggleSensorSaldo = async () => {
    const nextVal = !showCardBalance;
    setShowCardBalance(nextVal);
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tampilkan_saldo_leaderboard: nextVal }),
      });
      setUser((prev: any) => ({ ...prev, tampilkan_saldo_leaderboard: nextVal }));
    } catch (e) {
      console.error("Gagal menyimpan preferensi sensor saldo:", e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password");

      setMessage("Password berhasil diperbarui!");
      setNewPassword("");
      setShowPassword(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <ProfileSkeleton />
      </div>
    );
  }

  // Tentukan jenis role & kebutuhan profil
  const isDeveloper = user?.role === "super_admin";
  const isDekan = user?.role === "admin" && Boolean(user?.fakultas);
  const isKaprodi = user?.role === "admin" && Boolean(user?.prodi_id);
  const isAdminKelas = user?.role === "admin_kelas";
  const isAdminRole = isDeveloper || isDekan || isKaprodi || isAdminKelas || user?.role === "admin";
  const isMahasiswa = user?.role === "mahasiswa" || (!isDeveloper && !isDekan && !isKaprodi && !isAdminKelas);

  // Label badge role
  const roleBadgeLabel = user?.custom_title
    ? user.custom_title
    : isDeveloper
    ? "Tim Developer"
    : isDekan
    ? `Dekan - ${user.nama_fakultas || user.fakultas}`
    : isKaprodi
    ? `Kaprodi - ${user.nama_prodi || "Jurusan"}`
    : isAdminKelas
    ? "Adminya Kelas"
    : "Mahasiswa";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      {/* Header Halaman */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          {isDeveloper ? (
            <Terminal className="w-6 h-6 text-black dark:text-white" strokeWidth={2} />
          ) : isDekan || isKaprodi ? (
            <Building2 className="w-6 h-6 text-black dark:text-white" strokeWidth={2} />
          ) : (
            <User className="w-6 h-6 text-black dark:text-white" strokeWidth={2} />
          )}
          <span>
            {isDeveloper
              ? "Profil Tim Developer"
              : isDekan
              ? "Profil Dekan Fakultas"
              : isKaprodi
              ? "Profil Kaprodi"
              : isAdminKelas
              ? "Profil Pengurus Kelas"
              : "Pengaturan Akun & Profil"}
          </span>
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          {isDeveloper
            ? "Informasi akun pengembang sistem dan pengelola infrastruktur kampus."
            : isDekan || isKaprodi
            ? "Informasi akun pimpinan dan otoritas pengawasan akademik kampus."
            : "Kelola foto profil, username unik, dan keamanan kata sandi Anda."}
        </p>
      </div>

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ===== KOLOM KIRI (5/12): Avatar & Panel Sesuai Role ===== */}
          <div className="lg:col-span-5 space-y-6">
            {/* Card Avatar & Identitas Singkat */}
            <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs text-center space-y-4">
              {/* Avatar dengan Badge Kamera */}
              <div className="relative inline-block mx-auto">
                <div className="w-20 h-20 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-zinc-700">
                  {user.foto_url ? (
                    <img
                      src={user.foto_url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{user.nama?.charAt(0) || (isDeveloper ? "D" : "U")}</span>
                  )}
                </div>
                <label
                  htmlFor="avatar-input"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-md border-2 border-white dark:border-zinc-900 cursor-pointer hover:scale-110 transition-transform"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={uploadingPhoto}
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>

              {/* Nama, Username, dan Role Badge */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 truncate">
                  {user.nama}
                </h2>
                <div className="mt-1 flex items-center justify-center gap-2 text-xs">
                  {user.username ? (
                    <span className="font-mono text-gray-700 dark:text-zinc-300">@{user.username}</span>
                  ) : (
                    <span className="italic text-gray-400 dark:text-zinc-500">username belum di set</span>
                  )}
                  <span>&bull;</span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-[10px]">
                    {roleBadgeLabel}
                  </span>
                </div>
              </div>

              {/* Tombol Aksi Foto */}
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800/80">
                <label
                  htmlFor="avatar-input"
                  className={`px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                    uploadingPhoto ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  {uploadingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{uploadingPhoto ? "Mengunggah..." : "Ubah Foto"}</span>
                </label>

                {user.foto_url && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={uploadingPhoto}
                    className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {/* Feedback Alerts Foto */}
              {photoError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{photoError}</span>
                </div>
              )}

              {photoSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{photoSuccess}</span>
                </div>
              )}
            </div>

            {/* Panel Kiri Bawah Sesuai Role */}
            {isDeveloper ? (
              /* Role Developer: System Console Info (Bukan Kartu Mahasiswa) */
              <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-500" />
                    Developer System Scope
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-200 dark:border-emerald-900/40">
                    Full Access
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-600 dark:text-zinc-400 leading-relaxed">
                  <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/40">
                    <span>Akses Global</span>
                    <strong className="text-gray-900 dark:text-zinc-100">Super Administrator</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/40">
                    <span>Pusat Data</span>
                    <span className="font-mono text-gray-900 dark:text-zinc-200">SQLite High-Speed</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/40">
                    <span>Wilayah Kerja</span>
                    <span className="text-gray-900 dark:text-zinc-200">Seluruh Fakultas & Prodi</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Enkripsi Sesi</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Encrypted</span>
                  </div>
                </div>
              </div>
            ) : isDekan || isKaprodi ? (
              /* Role Dekan / Kaprodi: Academic Authority Scope */
              <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    Wilayah Otoritas Kampus
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[10px] border border-blue-200 dark:border-blue-900/40">
                    Pengawas Aktif
                  </span>
                </div>
                <div className="space-y-2 text-xs text-gray-600 dark:text-zinc-400">
                  <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/40">
                    <span>Tingkat Otoritas</span>
                    <strong className="text-gray-900 dark:text-zinc-100">
                      {isDekan ? "Fakultas (Dekanat)" : "Program Studi (Jurusan)"}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/40">
                    <span>Fakultas</span>
                    <span className="text-gray-900 dark:text-zinc-200 font-medium">
                      {user.nama_fakultas || user.fakultas || "Fakultas Ilmu Komputer"}
                    </span>
                  </div>
                  {isKaprodi && (
                    <div className="flex justify-between py-1">
                      <span>Program Studi</span>
                      <span className="text-gray-900 dark:text-zinc-200 font-medium">{user.nama_prodi}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Role Mahasiswa / Admin Kelas: Kartu ATM Virtual Sakune Debit */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Kartu Virtual Sakune</span>
                  </span>
                  {/* Tombol Mata Sensor Saldo Terintegrasi */}
                  <button
                    type="button"
                    onClick={handleToggleSensorSaldo}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                    title={showCardBalance ? "Sensor saldo di kartu & Leaderboard" : "Tampilkan nominal saldo"}
                  >
                    {showCardBalance ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Saldo Terbuka</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                        <span>Saldo Disensor</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Desain Kartu ATM Elegan */}
                <div className="relative rounded-2xl p-6 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white shadow-xl border border-zinc-800/80 aspect-[1.58/1] flex flex-col justify-between overflow-hidden group">
                  <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/5 blur-2xl pointer-events-none group-hover:bg-white/10 transition-all duration-700" />

                  {/* Top Row Kartu */}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-7 rounded-sm bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 relative shadow-inner overflow-hidden flex items-center justify-center">
                        <div className="w-full h-[1px] bg-amber-800/50 absolute top-1/2 -translate-y-1/2" />
                        <div className="h-full w-[1px] bg-amber-800/50 absolute left-1/3" />
                        <div className="h-full w-[1px] bg-amber-800/50 absolute right-1/3" />
                      </div>
                      <Wifi className="w-4 h-4 text-zinc-400 rotate-90" />
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black tracking-wider text-white block">
                        SAKUNE<span className="text-emerald-400">.</span>
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">
                        {isAdminKelas ? "ADMIN KELAS" : "DEBIT"}
                      </span>
                    </div>
                  </div>

                  {/* Saldo Siap Pakai di Tengah */}
                  <div className="relative z-10 my-auto py-2">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-widest block font-medium">
                      Saldo Dompet Utama
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white mt-0.5">
                      {showCardBalance
                        ? wallet !== null
                          ? `Rp ${wallet.balance.toLocaleString("id-ID")}`
                          : "Rp 0"
                        : "••••••••••"}
                    </div>
                  </div>

                  {/* Footer Kartu: Nomor ID & Cardholder */}
                  <div className="relative z-10 pt-2 border-t border-zinc-800/80 flex items-end justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-xs tracking-wider">
                        <span>{formatCardNumber(user.nomor_id || user.nim)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(user.nomor_id || user.nim || "");
                            setCopiedID(true);
                            setTimeout(() => setCopiedID(false), 2000);
                          }}
                          className="p-1 hover:text-white transition-colors cursor-pointer"
                          title="Salin ID"
                        >
                          {copiedID ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-500" />}
                        </button>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold truncate block mt-0.5 max-w-[180px]">
                        {user.nama}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-widest text-zinc-500 block">
                        Valid Thru
                      </span>
                      <span className="font-mono text-[11px] text-zinc-300 font-bold">
                        12/28
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== KOLOM KANAN (7/12): Data Detail Profil & Ganti Password ===== */}
          <div className="lg:col-span-7 space-y-6">
            {/* Card Detail Profil Sesuai Role */}
            <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/80">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  {isDeveloper ? (
                    <Terminal className="w-4 h-4 text-emerald-500" />
                  ) : isDekan || isKaprodi ? (
                    <Building2 className="w-4 h-4 text-blue-500" />
                  ) : (
                    <GraduationCap className="w-4 h-4" />
                  )}
                  <span>
                    {isDeveloper
                      ? "Informasi Akun Tim Developer"
                      : isDekan
                      ? "Informasi Jabatan Dekan"
                      : isKaprodi
                      ? "Informasi Jabatan Kaprodi"
                      : isAdminKelas
                      ? "Informasi Pengurus Kelas"
                      : "Data & Informasi Mahasiswa"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setUsernameInput(user.username || "");
                    setUsernameError("");
                    setIsEditingUsername(true);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Ubah Username</span>
                </button>
              </div>

              {/* Grid Informasi Berdasarkan Role */}
              {isDeveloper ? (
                /* === GRID TIM DEVELOPER (Tanpa NIM / Kelas) === */
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Nama Pengembang
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setUsernameInput(user.username || "");
                      setUsernameError("");
                      setIsEditingUsername(true);
                    }}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group"
                    title="Klik untuk ubah username"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Username
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {user.username ? (
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                        @{user.username}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400 dark:text-zinc-500 mt-1 block truncate">
                        username belum di set
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Jabatan Sistem
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
                      {user.custom_title || "Tim Developer"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Akses Otoritas
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      Akses Penuh Seluruh Sistem
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setIdInput(user.nomor_id || user.nim || "");
                      setIdError("");
                      setIsEditingId(true);
                    }}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group"
                    title="Klik untuk ubah ID Pengguna"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        ID Pengguna
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nomor_id || user.nim || "Belum di-set"}
                    </span>
                  </div>
                </div>
              ) : isDekan || isKaprodi ? (
                /* === GRID DEKAN / KAPRODI (Tanpa NIM, Fokus Fakultas & Prodi) === */
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Nama Pimpinan
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama}
                    </span>
                  </div>

                  <div
                    onClick={() => {
                      setUsernameInput(user.username || "");
                      setUsernameError("");
                      setIsEditingUsername(true);
                    }}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group"
                    title="Klik untuk ubah username"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Username
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {user.username ? (
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                        @{user.username}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400 dark:text-zinc-500 mt-1 block truncate">
                        username belum di set
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Fakultas
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama_fakultas || user.fakultas || "Fakultas Ilmu Komputer"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                      Lingkup Pengawasan
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 block truncate">
                      {isDekan ? "Semua Prodi di Fakultas" : `Prodi ${user.nama_prodi || "Terkait"}`}
                    </span>
                  </div>
                </div>
              ) : (
                /* === GRID MAHASISWA & PENGURUS KELAS (Ada NIM, Fakultas, Prodi, Kelas) === */
                <div className="grid grid-cols-2 gap-3">
                  {/* Nama Lengkap (Terkunci) */}
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Nama Lengkap
                      </span>
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama}
                    </span>
                  </div>

                  {/* Username (Bisa diubah mandiri via popup) */}
                  <div
                    onClick={() => {
                      setUsernameInput(user.username || "");
                      setUsernameError("");
                      setIsEditingUsername(true);
                    }}
                    className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group"
                    title="Klik untuk ubah username"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Username
                      </span>
                      <Pencil className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {user.username ? (
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                        @{user.username}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400 dark:text-zinc-500 mt-1 block truncate">
                        username belum di set
                      </span>
                    )}
                  </div>

                  {/* ID */}
                  <div
                    onClick={() => {
                      if (isAdminRole) {
                        setIdInput(user.nomor_id || user.nim || "");
                        setIdError("");
                        setIsEditingId(true);
                      }
                    }}
                    className={`p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 ${isAdminRole ? "cursor-pointer hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group" : ""}`}
                    title={isAdminRole ? "Klik untuk ubah ID" : undefined}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        ID
                      </span>
                      {isAdminRole ? (
                        <Pencil className="w-2.5 h-2.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-gray-400" />
                      )}
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nomor_id || user.nim}
                    </span>
                  </div>

                  {/* Fakultas (Terkunci) */}
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Fakultas
                      </span>
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama_fakultas || user.fakultas || "Fakultas Ilmu Komputer"}
                    </span>
                  </div>

                  {/* Program Studi (Terkunci) */}
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        Program Studi
                      </span>
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama_prodi || "Sistem Informasi"}
                    </span>
                  </div>

                  {/* Kelas (Terkunci) */}
                  <div className="p-3.5 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                        {isAdminKelas ? "Kelas Yang Diawasi" : "Kelas Perkuliahan"}
                      </span>
                      <Lock className="w-2.5 h-2.5 text-gray-400" />
                    </div>
                    <span className="text-xs font-bold font-mono text-gray-900 dark:text-zinc-100 mt-1 block truncate">
                      {user.nama_kelas || "-"}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/60 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-zinc-500">
                <Lock className="w-3 h-3 shrink-0" />
                <span>
                  {isDeveloper
                    ? "Kredensial pengembang dipantau oleh audit log keamanan sistem."
                    : isDekan || isKaprodi
                    ? "Data penugasan resmi pimpinan dikonfigurasi melalui dewan akademik."
                    : "Data akademik resmi hanya dapat diubah oleh Dekan, Kaprodi, atau Administrator."}
                </span>
              </div>
            </div>

            {/* Card Keamanan & Ganti Kata Sandi */}
            <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
                <KeyRound className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Keamanan Kata Sandi
                </h3>
              </div>

              {message && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full h-10 px-3 pr-10 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={loading || !newPassword}
                    className="h-10 px-5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    <span>{loading ? "Menyimpan..." : "Simpan Password Baru"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Monochrome Confirmation Modal for Photo Delete */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-black dark:text-white">
              Hapus Foto Profil?
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              Foto profil Anda akan dihapus dan avatar akun akan kembali menggunakan inisial nama.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmPhotoDelete}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Ubah Username */}
      {isEditingUsername && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <AtSign className="w-4 h-4 text-black dark:text-white" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  Ubah Username
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingUsername(false);
                  setUsernameInput(user.username || "");
                  setUsernameError("");
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUsername} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Username Baru
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400 dark:text-zinc-500 font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    placeholder="contoh: budi_santoso"
                    className="w-full h-10 pl-8 pr-3 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 font-mono text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5 leading-relaxed">
                  Gunakan huruf kecil, angka, atau underscore (_). Minimal 3 karakter.
                </p>
              </div>

              {usernameError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{usernameError}</span>
                </div>
              )}

              {usernameSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{usernameSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingUsername(false);
                    setUsernameInput(user.username || "");
                    setUsernameError("");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingUsername || !usernameInput.trim()}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingUsername ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ubah ID (Admin Only) */}
      {isEditingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                  Ubah ID Akun
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditingId(false);
                  setIdInput(user.nomor_id || user.nim || "");
                  setIdError("");
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveId} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  ID Baru
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={idInput}
                  onChange={(e) => setIdInput(e.target.value)}
                  placeholder="Masukkan ID baru..."
                  className="w-full h-10 px-3 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 font-mono text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1.5 leading-relaxed">
                  ID ini digunakan untuk login ke sistem. Minimal 3 karakter.
                </p>
              </div>

              {idError && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{idError}</span>
                </div>
              )}

              {idSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{idSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingId(false);
                    setIdInput(user.nomor_id || user.nim || "");
                    setIdError("");
                  }}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingId || !idInput.trim()}
                  className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {savingId ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
