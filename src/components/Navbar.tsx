"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import BottomNav, { BottomNavItem } from "./BottomNav";
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
  ChevronDown,
  Building2,
  ShieldCheck,
  Landmark,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(localStorage.getItem("sakune_user") || "null");
    } catch {
      return null;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // next-themes integration (attribute="class", default: light)
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        if (data.user) {
          try {
            localStorage.setItem("sakune_user", JSON.stringify(data.user));
          } catch {}
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  const isDark = mounted && theme === "dark";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    try {
      localStorage.removeItem("sakune_user");
    } catch {}
    setUser(null);
    router.push("/login");
  };

  if (pathname === "/login" || pathname === "/") return null;

  const isOnAdminRoute = pathname.startsWith("/admin");
  const isSuperAdmin = user?.role === "super_admin";
  const isAdminKelas = user?.role === "admin_kelas";
  const isAdmin = isOnAdminRoute || isSuperAdmin || user?.role === "admin" || isAdminKelas;

  const kampusChildren = [
    ...(isSuperAdmin
      ? [
          { href: "/admin/fakultas", label: "Fakultas", icon: Landmark },
          { href: "/admin/prodi", label: "Program Studi", icon: Building2 },
        ]
      : []),
    ...(!isAdminKelas
      ? [{ href: "/admin/kelas", label: "Kelas", icon: GraduationCap }]
      : []),
    { href: "/admin/mahasiswa", label: "Mahasiswa", icon: Users },
    { href: "/admin/grup", label: "Event Sakune", icon: Layers },
    ...(isSuperAdmin
      ? [{ href: "/admin/pengguna-admin", label: "Kelola Admin", icon: ShieldCheck }]
      : []),
  ];

  const navItems = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        {
          label: "Data Kampus",
          icon: Users,
          children: kampusChildren,
        },
        {
          label: "Keuangan & Audit",
          icon: ArrowRightLeft,
          children: [
            { href: "/admin/transaksi", label: "Transaksi", icon: ArrowRightLeft },
            { href: "/admin/laporan", label: "Laporan Rekap", icon: FileText },
            ...(isSuperAdmin
              ? [{ href: "/admin/log", label: "Audit Log", icon: ShieldAlert }]
              : []),
          ],
        },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/topup", label: "Top Up", icon: QrCode },
        { href: "/riwayat", label: "Riwayat", icon: History },
        { href: "/akun", label: "Akun", icon: User },
      ];

  const mobileNavItems: BottomNavItem[] = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        {
          label: "Kampus",
          icon: Users,
          children: kampusChildren,
        },
        {
          label: "Keuangan",
          icon: ArrowRightLeft,
          children: [
            { href: "/admin/transaksi", label: "Transaksi", icon: ArrowRightLeft },
            { href: "/admin/laporan", label: "Laporan Rekap", icon: FileText },
            ...(isSuperAdmin
              ? [{ href: "/admin/log", label: "Audit Log", icon: ShieldAlert }]
              : []),
          ],
        },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
        { href: "/topup", label: "Top Up", icon: QrCode },
        { href: "/riwayat", label: "Riwayat", icon: History },
      ];

  return (
    <>
      <header className="w-full h-16 bg-white dark:bg-zinc-950 border-b border-[#e5e5e5] dark:border-zinc-800 shadow-none">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="flex items-center gap-3 group"
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0">
                <img src="/icon.svg" alt="Sakune Logo" className="w-9 h-9 object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-black dark:text-white leading-none">
                  SAKUNE SISFOR
                </span>
                <span className="text-[11px] text-[#777] dark:text-zinc-500 uppercase tracking-[0.08em] font-medium mt-1">
                  {user?.custom_title
                    ? user.custom_title.toUpperCase()
                    : isSuperAdmin
                    ? "TIM DEVELOPER"
                    : isAdminKelas
                    ? "Adminya Kelas"
                    : user?.role === "admin"
                    ? user?.fakultas
                      ? "DEKAN"
                      : "ADMIN PRODI"
                    : "STUDENT PORTAL"}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (Layar lg ke atas) */}
          <nav className="hidden lg:flex items-center gap-1.5 h-full">
            {navItems.map((item) => {
              const Icon = item.icon;

              if (item.children) {
                const isChildActive = item.children.some((c) => pathname === c.href);
                const isOpen = openDropdown === item.label;

                return (
                  <div key={item.label} className="relative">
                    <button
                      onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                      className={`flex items-center gap-1.5 px-[14px] py-2 rounded-sm text-[15px] font-medium transition-colors cursor-pointer ${
                        isChildActive
                          ? "bg-black text-white dark:bg-white dark:text-black"
                          : "text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4 stroke-[1.8] shrink-0" />
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 stroke-[1.8] transition-transform duration-150 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="absolute left-0 mt-1.5 w-48 py-1 bg-white dark:bg-zinc-950 border border-[#e5e5e5] dark:border-zinc-800 rounded-sm shadow-sm z-50">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isSubActive = pathname === child.href;

                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpenDropdown(null)}
                              className={`flex items-center gap-2.5 px-3.5 py-2 text-[14px] transition-colors rounded-none ${
                                isSubActive
                                  ? "bg-[#f7f7f7] dark:bg-zinc-900 text-black dark:text-white font-medium"
                                  : "text-[#555] dark:text-zinc-400 hover:bg-[#f7f7f7] dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 stroke-[1.8] shrink-0" />
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
                  className={`flex items-center gap-1.5 px-[14px] py-2 rounded-sm text-[15px] font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.8] shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sisi Kanan: Theme Toggle, Pemisah, Avatar, Nama Truncate, Logout */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Toggle Tema (next-themes, icon Moon tanpa border) */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              aria-label="Ganti tema tampilan"
              className="p-2 text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
            >
              {isDark ? (
                <Sun className="w-4 h-4 stroke-[1.8]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[1.8]" />
              )}
            </button>

            {/* Garis Pemisah Vertikal Tipis */}
            <div className="h-5 w-[1px] bg-[#e5e5e5] dark:bg-zinc-800" />

            {/* User Profile */}
            {user && (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/akun"
                  className="flex items-center gap-2 group cursor-pointer"
                  title="Pengaturan Akun"
                >
                  <div className="w-7 h-7 rounded-full bg-[#eee] dark:bg-zinc-800 text-[#555] dark:text-zinc-300 flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
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
                  <span className="hidden sm:inline-block text-[14px] font-medium text-black dark:text-white max-w-[140px] truncate">
                    {user.nama}
                  </span>
                </Link>

                {/* Tombol Logout Ikon */}
                <button
                  onClick={handleLogout}
                  aria-label="Keluar dari akun"
                  title="Keluar"
                  className="p-1.5 text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                >
                  <LogOut className="w-4 h-4 stroke-[1.8]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Floating Bottom Tab Bar Melayang berbentuk Pil (Hanya di bawah lg) */}
    <BottomNav items={mobileNavItems} />
  </>
);
}
