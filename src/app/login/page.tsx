"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Lock, User, ShieldCheck, AlertCircle, ArrowLeft, Sun, Moon, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Must change password modal
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changing, setChanging] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nim, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal masuk");
      }

      if (data.user.must_change_password) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError("");

    if (newPassword.length < 6) {
      setChangeError("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangeError("Konfirmasi password tidak cocok");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password");

      router.push("/dashboard");
    } catch (err: any) {
      setChangeError(err.message);
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] text-[#111215] dark:text-[#f4f3ef] flex items-center justify-center py-12 px-4 sm:px-6 relative selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      {/* Subtle graph grid background (matches screenshot) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      {/* Main Sharp Login Card (0px border-radius, clean border lines, corner ticks) */}
      <div className="relative max-w-sm w-full border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#121316] p-8 rounded-none shadow-sm z-10 space-y-6">
        {/* Technical Corner Ticks */}
        <span className="tick -top-[5px] -left-[6px]" />
        <span className="tick -top-[5px] -right-[5px]" />
        <span className="tick -bottom-[5px] -left-[6px]" />
        <span className="tick -bottom-[5px] -right-[5px]" />

        {/* Top Header Rail: Brand + Dark Mode Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800">
          <span className="text-[10px] font-mono tracking-widest text-gray-400 dark:text-zinc-500 uppercase">
            SAKUNE SISFOR
          </span>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-7 h-7 border border-gray-200 dark:border-zinc-800 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            title="Ganti Mode Tampilan"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-gray-600" />}
          </button>
        </div>

        {/* Brand Header: Clean direct logo glyph beside Sign in text (no boxed container) */}
        <div className="flex items-center gap-3.5">
          <svg
            className="w-10 h-10 text-black dark:text-white shrink-0"
            viewBox="74 68 108 120"
            fill="currentColor"
            role="img"
            aria-label="Sakune Logo"
          >
            <path d="M 176 96 L 154 74 L 102 74 L 80 96 L 80 114 L 116 132 L 116 110 L 98 101 L 98 96 L 150 96 L 162 108 Z" />
            <path d="M 140 124 L 140 146 L 158 155 L 158 160 L 106 160 L 94 148 L 80 160 L 102 182 L 154 182 L 176 160 L 176 142 Z" />
          </svg>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-black dark:text-white leading-none">
              Sign in
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1">
              Sakune Sisfor · Portal Kas & Tabungan
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-none">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          {/* Field 1: ID / Username */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-zinc-200 mb-1.5">
              <User className="w-3.5 h-3.5 text-gray-500" />
              <span>ID / Username</span>
            </label>
            <input
              type="text"
              required
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Nomor ID atau Username"
              className="w-full h-10 px-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors font-mono"
            />
          </div>

          {/* Field 2: Password */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 dark:text-zinc-200 mb-1.5">
              <Lock className="w-3.5 h-3.5 text-gray-500" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 pl-3 pr-10 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-black dark:text-white rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-black dark:text-zinc-500 dark:hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Sembunyikan password" : "Lihat password"}
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold rounded-none tracking-wide flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 mt-2 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>

        {/* Footer Links (matches screenshot) */}
        <div className="pt-3 border-t border-gray-200 dark:border-zinc-800 text-center space-y-1 text-xs text-gray-500 dark:text-zinc-400">
          <p>
            Don&apos;t have an account?{" "}
            <span className="underline cursor-default text-zinc-900 dark:text-zinc-200 font-medium">
              Hubungi Admin
            </span>
          </p>
          <p>
            <span className="underline cursor-default">Forgot password?</span>
          </p>
        </div>

        {/* Bottom Link: Kembali ke Beranda (Replaces Uji Coba Cepat) */}
        <div className="pt-2 text-center border-t border-gray-100 dark:border-zinc-800/60">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-mono text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>

      {/* Must Change Password Modal */}
      {mustChangePassword && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121316] border border-gray-300 dark:border-zinc-800 max-w-md w-full p-6 space-y-4 rounded-none shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Ganti Kata Sandi Wajib</h3>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">Ini login pertama Anda. Wajib buat kata sandi baru.</p>
              </div>
            </div>

            {changeError && (
              <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 border border-rose-300 dark:border-rose-800">
                {changeError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Password Baru (min 6 karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 rounded-none focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 rounded-none focus:outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <button
                type="submit"
                disabled={changing}
                className="w-full h-9 bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 text-xs font-semibold rounded-none tracking-wide cursor-pointer transition-colors disabled:opacity-50"
              >
                {changing ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
