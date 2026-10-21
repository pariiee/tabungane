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
} from "lucide-react";

export default function AkunPage() {
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Username edit state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Privacy setting for leaderboard
  const [tampilkanSaldo, setTampilkanSaldo] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [privacyMsg, setPrivacyMsg] = useState("");

  // Photo profile upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Virtual Wallet Card State
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [showCardBalance, setShowCardBalance] = useState(true);
  const [copiedNIM, setCopiedNIM] = useState(false);

  const formatCardNumber = (nim: string = "") => {
    const clean = nim.replace(/\D/g, "");
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
          setTampilkanSaldo(Boolean(userData.user.tampilkan_saldo_leaderboard));
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

    if (file.size > 500 * 1024) {
      setPhotoError("Ukuran file foto maksimal 500 KB.");
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

  const handleTogglePrivacy = async (checked: boolean) => {
    setTampilkanSaldo(checked);
    setSavingPrivacy(true);
    setPrivacyMsg("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tampilkan_saldo_leaderboard: checked }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan preferensi privasi");
      setPrivacyMsg(
        checked
          ? "Saldo nominal Anda kini ditampilkan di Leaderboard."
          : "Saldo nominal Anda kini disembunyikan di Leaderboard."
      );
      setTimeout(() => setPrivacyMsg(""), 3000);
    } catch {
      setTampilkanSaldo(!checked);
    } finally {
      setSavingPrivacy(false);
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
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok");
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
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="py-4">
        <ProfileSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-32">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          <span>Pengaturan Akun & Profil</span>
        </h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          Kelola informasi identitas kampus, username, dan keamanan kata sandi Anda.
        </p>
      </div>

      {user && (
        <>
          {/* Avatar & Identitas Header */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar Preview with Camera Overlay */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-xl shadow-xs overflow-hidden border border-gray-200 dark:border-zinc-700">
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
                      <span>{user.nama?.charAt(0) || "U"}</span>
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

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 truncate">
                    {user.nama}
                  </h2>
                  <div className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-2">
                    {user.username ? (
                      <span className="font-mono text-gray-700 dark:text-zinc-300">@{user.username}</span>
                    ) : (
                      <span className="italic text-gray-400 dark:text-zinc-500">username belum di set</span>
                    )}
                    <span>&bull;</span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold text-[10px]">
                      {user.custom_title || (user.role === "super_admin" ? "Tim Developer" : user.role === "admin_kelas" ? "Adminya Kelas" : user.role)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                    Format JPG, PNG, WEBP &bull; Maks. 500 KB
                  </p>
                </div>
              </div>

              {/* Avatar Actions */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <label
                  htmlFor="avatar-input"
                  className={`px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
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
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hapus</span>
                  </button>
                )}
              </div>
            </div>

            {/* Photo Feedback Alerts */}
            {photoError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {photoSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{photoSuccess}</span>
              </div>
            )}
          </div>

          {/* Lengkap Info Akademik (Fakultas, Prodi, Kelas, NIM, Username) */}
          <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/60">
              <span className="text-xs font-bold uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Data & Informasi Mahasiswa
              </span>
              {!isEditingUsername ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Ubah Username</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingUsername(false);
                    setUsernameInput(user.username || "");
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Batal</span>
                </button>
              )}
            </div>

            {/* Username Edit Form */}
            {isEditingUsername && (
              <form onSubmit={handleSaveUsername} className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200/60 dark:border-zinc-800 space-y-2">
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-zinc-300">
                  Username Akun (Hanya huruf kecil, angka, underscore)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <AtSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      required
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
                      placeholder="contoh: budi_santoso"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingUsername}
                    className="px-4 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-semibold hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {savingUsername ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    <span>Simpan</span>
                  </button>
                </div>
                {usernameError && <p className="text-[11px] text-red-600 dark:text-red-400">{usernameError}</p>}
                {usernameSuccess && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{usernameSuccess}</p>}
              </form>
            )}

            {/* Grid 6 Detail */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  Nama Lengkap
                </span>
                <span className="text-xs font-bold text-black dark:text-white mt-1 block truncate">
                  {user.nama}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  Username
                </span>
                {user.username ? (
                  <span className="text-xs font-mono font-bold text-black dark:text-white mt-1 block truncate">
                    @{user.username}
                  </span>
                ) : (
                  <span className="text-xs italic text-gray-400 dark:text-zinc-500 mt-1 block truncate">
                    username belum di set
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  NIM
                </span>
                <span className="text-xs font-mono font-bold text-black dark:text-white mt-1 block truncate">
                  {user.nim}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  Fakultas
                </span>
                <span className="text-xs font-medium text-black dark:text-white mt-1 block truncate">
                  {user.nama_fakultas || user.fakultas || "Fakultas Ilmu Komputer"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  Program Studi
                </span>
                <span className="text-xs font-medium text-black dark:text-white mt-1 block truncate">
                  {user.nama_prodi || "Sistem Informasi"}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 block">
                  Kelas
                </span>
                <span className="text-xs font-bold font-mono text-black dark:text-white mt-1 block truncate">
                  {user.nama_kelas || "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Virtual Credit / Debit Card Wallet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Kartu Virtual Sakune</span>
              </span>
              <button
                type="button"
                onClick={() => setShowCardBalance(!showCardBalance)}
                className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
              >
                {showCardBalance ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showCardBalance ? "Sensor Saldo" : "Lihat Saldo"}</span>
              </button>
            </div>

            <div className="relative rounded-2xl p-6 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white shadow-xl border border-zinc-800/80">
              {/* Header Kartu */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
                  SAKUNE SISFOR DEBIT
                </span>
                <div className="w-7 h-5 rounded bg-amber-400/80 border border-amber-300/40 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%)]" />
                </div>
              </div>

              {/* EMV Microchip */}
              <div className="mt-5 flex items-center gap-3">
                <div className="w-9 h-7 rounded bg-amber-300/90 border border-amber-200 shadow-inner flex items-center justify-center">
                  <div className="w-7 h-5 border border-amber-500/50 rounded-xs" />
                </div>
                <span className="text-[10px] text-zinc-400 font-mono tracking-wider">
                  DIGITAL WALLET
                </span>
              </div>

              {/* Saldo Dompet */}
              <div className="mt-5">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
                  Saldo Siap Pakai
                </span>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white">
                    {showCardBalance
                      ? wallet
                        ? `Rp ${wallet.balance.toLocaleString("id-ID")}`
                        : "Rp 0"
                      : "••••••••••"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
                    Aktif
                  </span>
                </div>
              </div>

              {/* Footer Kartu */}
              <div className="mt-6 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono">{formatCardNumber(user.nim)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(user.nim);
                      setCopiedNIM(true);
                      setTimeout(() => setCopiedNIM(false), 2000);
                    }}
                    className="p-1 hover:text-white transition-colors cursor-pointer"
                    title="Salin NIM"
                  >
                    {copiedNIM ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <span className="text-[11px] font-semibold text-zinc-300">MAHASISWA PORTAL</span>
              </div>
            </div>
          </div>

          {/* Privacy Settings Leaderboard */}
          <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Privasi Saldo di Leaderboard
                </h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Tentukan apakah nominal uang tabungan Anda ditampilkan atau disensor (•••••••) di Leaderboard kampus.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                <input
                  type="checkbox"
                  checked={tampilkanSaldo}
                  disabled={savingPrivacy}
                  onChange={(e) => handleTogglePrivacy(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="text-[11px] text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-950 p-2.5 rounded border border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <span>
                Status saat ini:{" "}
                <strong className={tampilkanSaldo ? "text-emerald-600 dark:text-emerald-400" : "text-gray-600 dark:text-zinc-300"}>
                  {tampilkanSaldo ? "Nominal Terlihat Publik" : "Nominal Disensor / Tersembunyi"}
                </strong>
              </span>
              {savingPrivacy && <span className="animate-pulse text-xs">Menyimpan...</span>}
            </div>

            {privacyMsg && (
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded border border-emerald-200/50 dark:border-emerald-800/30">
                {privacyMsg}
              </div>
            )}
          </div>
        </>
      )}

      {/* Change Password Card */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-zinc-800/50">
          <KeyRound className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">
            Ganti Kata Sandi
          </h3>
        </div>

        {message && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-lg border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Password Baru (min. 6 karakter)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            <span>{loading ? "Menyimpan Perubahan..." : "Simpan Password Baru"}</span>
          </button>
        </form>
      </div>

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
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmPhotoDelete}
                className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
