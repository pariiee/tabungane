"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
            <Wallet className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            TABUNGANE <span className="text-emerald-600">SISFOR</span>
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Platform Tabungan Bersama Mahasiswa & Kas Kelas
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              NIM atau Username Admin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                required
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                placeholder="240101 atau admin"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk ke Sistem"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center mb-2 font-medium">Uji Coba Cepat (Akun Bawaan):</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setNim("240101");
                setPassword("password123");
              }}
              className="py-1.5 px-2 text-xs font-medium border border-gray-200 rounded-md hover:bg-emerald-50 hover:border-emerald-300 text-gray-600 hover:text-emerald-700 transition-colors text-center"
            >
              Mahasiswa: 240101
            </button>
            <button
              type="button"
              onClick={() => {
                setNim("admin");
                setPassword("admin123");
              }}
              className="py-1.5 px-2 text-xs font-medium border border-gray-200 rounded-md hover:bg-purple-50 hover:border-purple-300 text-gray-600 hover:text-purple-700 transition-colors text-center"
            >
              Admin: admin
            </button>
          </div>
        </div>
      </div>

      {/* Must Change Password Modal */}
      {mustChangePassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Ganti Password Wajib</h3>
                <p className="text-xs text-gray-500">Ini login pertama Anda. Wajib buat password baru.</p>
              </div>
            </div>

            {changeError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {changeError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password Baru (min 6 karakter)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={changing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {changing ? "Menyimpan..." : "Simpan Password & Masuk"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
