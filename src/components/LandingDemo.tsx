"use client";

import { useState } from "react";
import {
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  RefreshCw,
} from "lucide-react";

export default function LandingDemo() {
  const [balance, setBalance] = useState(1250000);
  const [hideBalance, setHideBalance] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  const simulateTopUp = () => {
    setAnimating(true);
    setLastAction("Menunggu QRIS Settlement...");
    setTimeout(() => {
      setBalance((b) => b + 50000);
      setLastAction("Top Up QRIS Rp 50.000 Berhasil!");
      setAnimating(false);
    }, 700);
  };

  const simulateAlokasi = () => {
    if (balance < 20000) return;
    setAnimating(true);
    setLastAction("Mengalokasikan ke Kas Kelas...");
    setTimeout(() => {
      setBalance((b) => b - 20000);
      setLastAction("Alokasi Kas Semester -Rp 20.000 Berhasil!");
      setAnimating(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      {/* Interactive Virtual Card */}
      <div className="relative rounded-2xl p-6 sm:p-7 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white shadow-2xl border border-zinc-800 transition-all duration-300">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
              SAKUNE SISFOR CARD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHideBalance(!hideBalance)}
              className="text-zinc-400 hover:text-white transition-colors p-1"
              title={hideBalance ? "Tampilkan Saldo" : "Sensor Saldo"}
            >
              {hideBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <div className="w-7 h-5 rounded bg-amber-400/80 border border-amber-300/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.2)_50%,transparent_75%)]" />
            </div>
          </div>
        </div>

        {/* Card Chip & RFID */}
        <div className="mt-5 flex items-center gap-2">
          <div className="w-9 h-7 rounded bg-amber-300/90 border border-amber-200 shadow-inner flex items-center justify-center">
            <div className="w-7 h-5 border border-amber-500/50 rounded-xs" />
          </div>
          <span className="text-xs text-zinc-400 font-mono tracking-wider">WALLET DIGITAL DEMO</span>
        </div>

        {/* Realtime Balance Demo */}
        <div className="mt-5">
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">
            Saldo Dompet Saku
          </span>
          <div className="flex items-center justify-between mt-0.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-white transition-all">
              {hideBalance ? "••••••••••" : `Rp ${balance.toLocaleString("id-ID")}`}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold border border-emerald-500/30">
              Realtime
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono">ID: 240101••••</span>
          <span className="text-[11px] font-semibold text-zinc-300">MAHASISWA PORTAL</span>
        </div>
      </div>

      {/* Simulator Action Controls */}
      <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Coba Simulator Langsung
          </span>
          {lastAction && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {lastAction}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={simulateTopUp}
            disabled={animating}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {animating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
            )}
            <span>+ Top Up QRIS Rp 50rb</span>
          </button>

          <button
            onClick={simulateAlokasi}
            disabled={animating}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-750 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {animating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
            )}
            <span>- Bayar Kas Rp 20rb</span>
          </button>
        </div>
      </div>
    </div>
  );
}
