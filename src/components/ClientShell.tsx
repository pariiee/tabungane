"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    const isCol = localStorage.getItem("sidebar_collapsed");
    if (isCol !== null) {
      setCollapsed(isCol === "true");
    }
  }, []);

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar_collapsed", String(next));
  };

  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex flex-col justify-center">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 flex">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          collapsed ? "pl-16" : "pl-60"
        }`}
      >
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
