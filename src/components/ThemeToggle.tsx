"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({
  className = "",
  size = "sm",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  if (!mounted) {
    return (
      <div
        className={`w-7 h-7 flex items-center justify-center opacity-30 ${className}`}
        aria-hidden="true"
      >
        <Moon className={`${iconClass} text-gray-400`} />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`w-7 h-7 flex items-center justify-center text-gray-600 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer rounded ${className}`}
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className={`${iconClass} text-amber-400 transition-transform hover:rotate-45`} />
      ) : (
        <Moon className={`${iconClass} text-gray-700 dark:text-gray-300 transition-transform hover:-rotate-12`} />
      )}
    </button>
  );
}
