"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 border border-gray-200 dark:border-zinc-800 flex items-center justify-center opacity-40 ${className}`}>
        <Moon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-8 h-8 border border-gray-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-900 flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded-none ${className}`}
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
    >
      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-700" />}
    </button>
  );
}
