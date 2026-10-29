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
  GraduationCap,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user));

    const savedTheme = localStorage.getItem("tabungane_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, [pathname]);

  const toggleTheme = () => {
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    if (isCurrentlyDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("tabungane_theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("tabungane_theme", "dark");
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (pathname === "/login") return null;

  const isAdmin = user?.role === "admin" || user?.role === "super_admin" || user?.role === "admin_kelas" || user?.role === "dekan" || user?.role === "kaprodi";

  const navItems = isAdmin
    ? [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/kelas", label: "Kelas", icon: GraduationCap },
        { href: "/admin/mahasiswa", label: "Mahasiswa", icon: Users },
        { href: "/admin/grup", label: "Event Sakune", icon: Layers },
        { href: "/admin/transaksi", label: "Transaksi", icon: ArrowRightLeft },
        { href: "/admin/laporan", label: "Laporan", icon: FileText },
        { href: "/admin/log", label: "Audit Log", icon: ShieldAlert },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/topup", label: "Top Up QRIS", icon: QrCode },
        { href: "/riwayat", label: "Riwayat", icon: History },
        { href: "/akun", label: "Profil Akun", icon: User },
      ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300 flex flex-col justify-between select-none ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className={`h-16 flex items-center border-b border-gray-100 dark:border-zinc-800 ${collapsed ? "justify-center px-2" : "px-4 gap-3"} overflow-hidden`}>
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/icon.svg" alt="Sakune Logo" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100 block">
                SAKUNE
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium tracking-wider uppercase block">
                SISFOR &bull; {isAdmin ? "ADMIN" : "MAHASISWA"}
              </span>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="p-2 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center ${collapsed ? "justify-center py-2.5 px-0" : "gap-3 px-3 py-2"} rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "text-black dark:text-white bg-gray-100/80 dark:bg-zinc-800"
                    : "text-gray-400 dark:text-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-900 hover:text-gray-900 dark:hover:text-zinc-200"
                }`}
              >
                {isActive && collapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-black dark:bg-white rounded-r" />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Area with Handle/Pill, Theme, and Logout */}
      <div className="p-2 border-t border-gray-100 dark:border-zinc-800/80 space-y-2">
        {/* Handle / Pill collapse button */}
        <div className="flex justify-center">
          <button
            onClick={onToggle}
            title={collapsed ? "Buka Sidebar" : "Lipat Sidebar"}
            className="w-10 h-3 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center transition-colors group cursor-pointer"
          >
            {collapsed ? (
              <ChevronRight className="w-2.5 h-2.5 text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-100" />
            ) : (
              <ChevronLeft className="w-2.5 h-2.5 text-gray-500 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-100" />
            )}
          </button>
        </div>

        {/* Theme Toggle & Logout Buttons */}
        <div className={`flex items-center ${collapsed ? "flex-col gap-1" : "justify-between px-1"}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Mode Terang" : "Mode Gelap"}
            className="p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile / Logout */}
          <button
            onClick={handleLogout}
            title="Keluar (Logout)"
            className="p-2 rounded-xl text-gray-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
