"use client";

import { useEffect, useState } from "react";
import {
  User,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Wifi,
  Copy,
  Check,
  CreditCard,
} from "lucide-react";

export default function AkunPage() {
  const [user, setUser] = useState<any>(null);
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

  const handlePhotoDelete = async () => {
    if (!confirm("Hapus foto profil dan gunakan avatar default?")) return;
    setPhotoError("");
    setPhotoSuccess("");
    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/auth/me/avatar", {
        method: "DELETE",
      });
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

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setTampilkanSaldo(Boolean(data.user.tampilkan_saldo_leaderboard));
        }
      });

    fetch("/api/student/wallet")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.balance === "number") {
          setWallet(data);
        }
      })
      .catch(() => {});
  }, []);

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
      setPrivacyMsg(checked ? "Saldo nominal Anda kini ditampilkan di Leaderboard." : "Saldo nominal Anda kini disembunyikan di Leaderboard.");
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

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <User className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          <span>Pengaturan Akun & Keamanan</span>
        </h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          Kelola profil identitas dan perbarui kata sandi akun Anda.
        </p>
      </div>

      {user && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs space-y-4">
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
                  ) : null}
                  {(!user.foto_url || undefined) && (
                    <span className={user.foto_url ? "hidden" : "block"}>
                      {user.nama?.charAt(0) || "U"}
                    </span>
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
                  <span>
                    NIM: <strong className="text-gray-700 dark:text-zinc-300">{user.nim}</strong>
                  </span>
                  <span>&bull;</span>
                  <span className="capitalize px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-medium text-[10px]">
                    {user.role}
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
                  onClick={handlePhotoDelete}
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

          {/* Feedback Alerts */}
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
      )}

      {/* Virtual Credit / Debit Card Wallet */}
      {user && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kartu Digital Mahasiswa</span>
            </span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
              Virtual Debit
            </span>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white p-6 sm:p-7 shadow-xl border border-zinc-800/80 group">
            {/* Ambient Background Accents */}
            <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />
            <div className="absolute -left-16 -bottom-16 w-48 h-48 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            {/* Top Row: Chip + Contactless & Logo */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-3">
                {/* Metallic Microchip */}
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 relative shadow-inner overflow-hidden flex items-center justify-center">
                  <div className="w-full h-[1px] bg-amber-800/50 absolute top-1/2 -translate-y-1/2" />
                  <div className="h-full w-[1px] bg-amber-800/50 absolute left-1/3" />
                  <div className="h-full w-[1px] bg-amber-800/50 absolute right-1/3" />
                  <div className="w-3.5 h-3.5 rounded-sm border border-amber-900/40 bg-amber-400/20" />
                </div>
                {/* Contactless Wave */}
                <Wifi className="w-5 h-5 text-zinc-400 rotate-90" />
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 font-black text-xs tracking-wider">
                  <span className="text-white">SAKUNE</span>
                  <span className="text-emerald-400">SISFOR</span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-semibold block">
                  {user.role === "admin" ? "Staff Debit" : "Platinum Student"}
                </span>
              </div>
            </div>

            {/* Middle Row: Saldo & Masked Card / NIM Number */}
            <div className="my-6 relative z-10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-medium block">
                    Saldo Dompet Utama
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
                      {showCardBalance
                        ? wallet !== null
                          ? `Rp ${wallet.balance.toLocaleString("id-ID")}`
                          : "Rp 0"
                        : "Rp ••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCardBalance(!showCardBalance)}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title={showCardBalance ? "Sembunyikan Saldo" : "Tampilkan Saldo"}
                    >
                      {showCardBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Card Network Rings (Emblem) */}
                <div className="flex items-center -space-x-2.5 opacity-80">
                  <div className="w-7 h-7 rounded-full bg-white/20 border border-white/30 backdrop-blur-xs" />
                  <div className="w-7 h-7 rounded-full bg-emerald-500/30 border border-emerald-400/40 backdrop-blur-xs" />
                </div>
              </div>

              {/* Virtual Card Number based on NIM */}
              <div className="pt-1 flex items-center justify-between text-zinc-300 font-mono text-sm sm:text-base tracking-[0.2em]">
                <span>{formatCardNumber(user.nim)}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(user.nim || "");
                    setCopiedNIM(true);
                    setTimeout(() => setCopiedNIM(false), 2000);
                  }}
                  className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1 font-sans tracking-normal"
                  title="Salin Nomor Identitas (NIM)"
                >
                  {copiedNIM ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span className="text-[10px] text-zinc-400">{copiedNIM ? "Tersalin" : "NIM"}</span>
                </button>
              </div>
            </div>

            {/* Bottom Row: Holder Name & Expiry */}
            <div className="flex items-end justify-between relative z-10 pt-3 border-t border-white/10 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium block">
                  Cardholder
                </span>
                <span className="font-semibold tracking-wide uppercase text-zinc-100 font-mono truncate max-w-[200px] sm:max-w-xs block">
                  {user.nama || "MAHASISWA SISFOR"}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium block">
                  Valid Thru
                </span>
                <span className="font-mono text-zinc-100 font-semibold tracking-wider">
                  12/28
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Privacy Settings */}
      {user?.role === "mahasiswa" && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tampilkanSaldo ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
              <div>
                <h3 className="font-bold text-black dark:text-white text-sm">
                  Privasi Saldo Leaderboard
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  Tampilkan nominal rupiah tabungan saya di peringkat Leaderboard publik.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
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
      )}

      {/* Change Password Card */}
      <div className="bg-white dark:bg-[#111113] border border-gray-100 dark:border-zinc-800/80 rounded-xl p-6 shadow-xs space-y-4">
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
            className="w-full h-10 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            <span>{loading ? "Menyimpan Perubahan..." : "Simpan Password Baru"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
