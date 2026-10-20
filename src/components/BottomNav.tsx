"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

export type BottomNavItem = {
  href?: string;
  label: string;
  icon: any;
  children?: { href: string; label: string; icon: any }[];
};

export default function BottomNav({ items }: { items: BottomNavItem[] }) {
  const pathname = usePathname();
  const [activeSheet, setActiveSheet] = useState<BottomNavItem | null>(null);

  // Close sheet on route change
  useEffect(() => {
    setActiveSheet(null);
  }, [pathname]);

  if (pathname === "/login") return null;

  return (
    <>
      {/* Bottom Sheet Drawer for Submenu (Kampus & Keuangan) */}
      {activeSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveSheet(null)}
            aria-label="Tutup menu"
          />

          {/* Sheet Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 rounded-t-3xl border-t border-[#e5e5e5] dark:border-zinc-800 p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-gray-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-850">
              <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                {activeSheet.label}
              </span>
              <button
                type="button"
                onClick={() => setActiveSheet(null)}
                aria-label="Tutup"
                className="p-1 rounded-full text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[1.8]" />
              </button>
            </div>

            {/* List Links (Tinggi minimal 48px) */}
            <div className="grid grid-cols-1 gap-1.5 mt-3">
              {activeSheet.children?.map((child) => {
                const ChildIcon = child.icon;
                const isSubActive = pathname === child.href;

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setActiveSheet(null)}
                    className={`min-h-[48px] py-3 px-4 rounded-xl flex items-center gap-3.5 text-[14px] font-medium transition-colors ${
                      isSubActive
                        ? "bg-[#1c1c1e] text-white shadow-xs"
                        : "text-[#555] dark:text-zinc-300 hover:bg-[#ececee] dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <ChildIcon className="w-5 h-5 stroke-[1.8] shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Tab Bar Pill (Hanya di bawah breakpoint lg) */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(12px,env(safe-area-inset-bottom))] px-3 pointer-events-none lg:hidden">
        <nav
          aria-label="Navigasi Bawah Mobile"
          className="w-full max-w-md pointer-events-auto rounded-full bg-white dark:bg-zinc-900 p-2 shadow-[0_12px_32px_rgba(0,0,0,0.14)] border border-gray-100 dark:border-zinc-800"
        >
          <div className="rounded-full bg-[#ececee] dark:bg-zinc-800 p-1.5 shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)] grid grid-cols-4 gap-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isChildActive = item.children?.some((c) => pathname === c.href);
              const isActive = item.children ? isChildActive : pathname === item.href;

              if (item.children) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() =>
                      setActiveSheet(activeSheet?.label === item.label ? null : item)
                    }
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                    className={`flex flex-col items-center justify-center gap-1 rounded-full py-2.5 min-h-[56px] transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#1c1c1e] text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
                        : "text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-[22px] h-[22px] stroke-[1.6]" />
                    <span className="text-[12px] sm:text-[13px] font-normal leading-none tracking-tight">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className={`flex flex-col items-center justify-center gap-1 rounded-full py-2.5 min-h-[56px] transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#1c1c1e] text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)]"
                      : "text-[#555] dark:text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-[22px] h-[22px] stroke-[1.6]" />
                  <span className="text-[12px] sm:text-[13px] font-normal leading-none tracking-tight">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
