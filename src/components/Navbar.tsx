"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Wallet,
  LayoutDashboard,
  QrCode,
  History,
  User,
  LogOut,
  Users,
  Layers,
  FileText,
  Settings,
  ShieldAlert,
  ArrowRightLeft,
  GraduationCap
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  if (loading || pathname === "/login") return null;

  const isAdmin = user?.role === "admin";

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2 font-bold text-emerald-600 text-lg">
              <Wallet className="w-6 h-6 text-emerald-600" />
              <span>TABUNGANE <span className="text-gray-800">SISFOR</span></span>
            </Link>

            {/* Role Badge */}
            {user && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                isAdmin ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
              }`}>
                {isAdmin ? "Admin" : "Mahasiswa"}
              </span>
            )}
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {!isAdmin ? (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/dashboard" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/topup"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/topup" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Top Up QRIS
                </Link>
                <Link
                  href="/riwayat"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === "/riwayat" ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <History className="w-4 h-4" />
                  Riwayat
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/admin/kelas"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/kelas" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Kelas
                </Link>
                <Link
                  href="/admin/mahasiswa"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/mahasiswa" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Mahasiswa
                </Link>
                <Link
                  href="/admin/grup"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/grup" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Grup
                </Link>
                <Link
                  href="/admin/transaksi"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/transaksi" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Transaksi
                </Link>
                <Link
                  href="/admin/laporan"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/laporan" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Laporan
                </Link>
                <Link
                  href="/admin/log"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/log" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Audit
                </Link>
                <Link
                  href="/admin/pengaturan"
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md text-sm font-medium ${
                    pathname === "/admin/pengaturan" ? "bg-purple-50 text-purple-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Config
                </Link>
              </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/akun"
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:inline">{user.nama}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
