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
  ShieldAlert,
  ArrowRightLeft,
  GraduationCap,
  Moon,
  Sun,
  Menu,
  X,
  Trophy,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {});

    const savedTheme = localStorage.getItem("tabungane_theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    }
  }, [pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
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
    setUser(null);
    router.push("/login");
  };

  if (pathname === "/login") return null;

  const isAdmin = user?.role === "admin";

  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        {
          label: "Data Kampus",
          icon: Users,
          children: [
            { href: "/admin/mahasiswa", label: "Mahasiswa", icon: Users },
            { href: "/admin/kelas", label: "Kelas", icon: GraduationCap },
            { href: "/admin/grup", label: "Event Sakune", icon: Layers },
          ],
        },
        {
          label: "Keuangan & Audit",
          icon: ArrowRightLeft,
          children: [
            { href: "/admin/transaksi", label: "Transaksi", icon: ArrowRightLeft },
            { href: "/admin/laporan", label: "Laporan Rekap", icon: FileText },
            { href: "/admin/log", label: "Audit Log", icon: ShieldAlert },
          ],
        },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/topup", label: "Top Up QRIS", icon: QrCode },
        { href: "/riwayat", label: "Riwayat", icon: History },
        { href: "/akun", label: "Akun", icon: User },
      ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center gap-2.5 font-bold tracking-tight text-gray-900 dark:text-zinc-100 group"
            >
              <div className="w-8 h-8 rounded-lg bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
                S
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold tracking-tight leading-none text-black dark:text-white">
                  SAKUNE <span className="text-emerald-600 dark:text-emerald-400">SISFOR</span>
                </span>
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 tracking-wider uppercase font-medium mt-0.5">
                  {isAdmin ? "Super Admin" : "Student Portal"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const isChildActive = item.children.some((c) => pathname === c.href);
                const isOpen = openDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isChildActive
                          ? "bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs"
                          : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 mt-1.5 w-44 py-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg z-50">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isSubActive = pathname === child.href;

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                                isSubActive
                                  ? "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white font-semibold"
                                  : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white"
                              }`}
                            >
                              <ChildIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs"
                      : "text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-zinc-800">
                <Link
                  href="/akun"
                  className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center text-xs font-semibold overflow-hidden">
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
                    <span className={user.foto_url ? "hidden" : "block"}>
                      {user.nama?.charAt(0) || "U"}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-zinc-100 max-w-[100px] truncate">
                    {user.nama}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Keluar"
                  className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-5 space-y-1 shadow-lg">
          <div className="grid grid-cols-1 gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                return (
                  <div key={item.label} className="pt-2">
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      {item.label}
                    </div>
                    <div className="grid grid-cols-1 gap-0.5 mt-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isSubActive = pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                              isSubActive
                                ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                                : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                            }`}
                          >
                            <ChildIcon className="w-4 h-4 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black font-semibold"
                      : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {user && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <Link
                href="/akun"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-xs font-medium text-gray-800 dark:text-zinc-200"
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold overflow-hidden">
                  {user.foto_url ? (
                    <img src={user.foto_url} alt={user.nama} className="w-full h-full object-cover" />
                  ) : (
                    user.nama?.charAt(0) || "U"
                  )}
                </div>
                <span>{user.nama} ({user.nim})</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-medium px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
