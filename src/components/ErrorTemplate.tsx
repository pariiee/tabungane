"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getErrorInfo } from "@/lib/error-dict";
import {
  ArrowLeft,
  Home,
  RefreshCw,
  ShieldAlert,
  ServerCrash,
  AlertTriangle,
  Radio,
  FileQuestion
} from "lucide-react";

interface ErrorTemplateProps {
  code: string | number;
  customMessage?: string;
  onReset?: () => void;
  path?: string;
}

export default function ErrorTemplate({
  code,
  customMessage,
  onReset,
  path,
}: ErrorTemplateProps) {
  const router = useRouter();
  const info = getErrorInfo(code);

  const getCategoryIcon = () => {
    if (info.category === "server") {
      return <ServerCrash className="w-5 h-5 text-gray-700 dark:text-zinc-300" />;
    }
    if (info.category === "infra") {
      return <Radio className="w-5 h-5 text-gray-700 dark:text-zinc-300" />;
    }
    if (String(code).startsWith("401") || String(code).startsWith("403")) {
      return <ShieldAlert className="w-5 h-5 text-gray-700 dark:text-zinc-300" />;
    }
    if (String(code) === "404") {
      return <FileQuestion className="w-5 h-5 text-gray-700 dark:text-zinc-300" />;
    }
    return <AlertTriangle className="w-5 h-5 text-gray-700 dark:text-zinc-300" />;
  };

  const categoryLabel =
    info.category === "client"
      ? "Client Request Error (4xx)"
      : info.category === "server"
      ? "Server Execution Error (5xx)"
      : "Edge Network & Proxy Error";

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-center">
        {/* Header Badge & Code */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/60 text-xs font-mono text-gray-600 dark:text-zinc-400">
            {getCategoryIcon()}
            <span className="font-semibold uppercase tracking-wider">{categoryLabel}</span>
          </div>

          <div className="text-6xl sm:text-7xl font-mono font-black tracking-tighter text-gray-900 dark:text-zinc-100 select-none">
            {info.code}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100">
            {info.name}
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
            {customMessage || info.desc}
          </p>
        </div>

        {/* Saran Tindakan / Hint Box */}
        <div className="p-3.5 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200/80 dark:border-zinc-800 text-left space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
            Saran Pemecahan:
          </div>
          <p className="text-xs text-gray-700 dark:text-zinc-300">
            {info.hint}
          </p>
          {path && (
            <div className="pt-2 mt-2 border-t border-gray-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[10px] text-gray-400 font-mono">
              <span>Path: {path}</span>
              <span>HTTP {info.code}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              if (onReset) onReset();
              else window.location.reload();
            }}
            className="w-full sm:flex-1 h-9.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 h-9.5 px-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sebelumnya</span>
          </button>

          <Link
            href="/dashboard"
            className="w-full sm:flex-1 h-9.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
