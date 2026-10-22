"use client";

import { useState } from "react";
import { Wallet, QrCode, ShieldCheck, ArrowRightLeft, Check, Sparkles } from "lucide-react";

export default function HeroVisualArt() {
  const [activeTab, setActiveTab] = useState<"kantong" | "qris">("kantong");
  const [activePocket, setActivePocket] = useState(0);

  const pockets = [
    { name: "Kantong Utama", type: "Dompet Saku", balance: "Rp 350.000", color: "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" },
    { name: "Pos Kegiatan", type: "Sub-Wallet A", balance: "Rp 500.000", color: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    { name: "Dana Darurat", type: "Sub-Wallet B", balance: "Rp 200.000", color: "border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400" },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Decorative Technical Crosshair Corner Ticks */}
      <span className="tick -top-2.5 -left-2.5" />
      <span className="tick -top-2.5 -right-2.5" />
      <span className="tick -bottom-2.5 -left-2.5" />
      <span className="tick -bottom-2.5 -right-2.5" />

      {/* Main Glassmorphic Art Shell */}
      <div className="rounded-2xl border border-[#111215]/15 dark:border-white/15 bg-white/80 dark:bg-[#121318]/80 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4 overflow-hidden relative">
        {/* Subtle background SVG circuit / radial glow */}
        <div className="absolute -right-20 -top-20 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* HUD Top Bar */}
        <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 pb-3 text-[11px] font-mono text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Simulasi Saku</span>
          </div>
          <div className="flex gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-zinc-800">
            <button
              onClick={() => setActiveTab("kantong")}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                activeTab === "kantong"
                  ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-xs font-semibold"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Kantong
            </button>
            <button
              onClick={() => setActiveTab("qris")}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                activeTab === "qris"
                  ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-xs font-semibold"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              QRIS
            </button>
          </div>
        </div>

        {activeTab === "kantong" ? (
          /* View 1: Interactive Pocket Card Matrix */
          <div className="space-y-3.5">
            {/* Active Card Preview */}
            <div className={`p-4 sm:p-5 rounded-xl transition-all duration-300 ${pockets[activePocket].color}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider opacity-70">
                    {pockets[activePocket].type}
                  </span>
                  <h4 className="text-base font-bold mt-0.5">{pockets[activePocket].name}</h4>
                </div>
                <div className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="mt-5 flex justify-between items-end">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">Saldo Aktif</span>
                  <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight">
                    {pockets[activePocket].balance}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/15">
                  ID: SIMULASI-0{activePocket + 1}
                </span>
              </div>
            </div>

            {/* Pocket Selector Pills */}
            <div className="grid grid-cols-3 gap-2">
              {pockets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePocket(idx)}
                  className={`p-2 rounded-lg text-left border text-[11px] transition-all cursor-pointer ${
                    activePocket === idx
                      ? "border-black dark:border-white bg-gray-50 dark:bg-zinc-800/80 font-semibold"
                      : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-500"
                  }`}
                >
                  <span className="text-[9px] block font-mono text-gray-400">0{idx + 1}</span>
                  <span className="truncate block text-zinc-900 dark:text-zinc-100">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* View 2: QRIS Instant Verification Showcase */
          <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 text-center space-y-3">
            <div className="w-24 h-24 mx-auto border border-gray-300 dark:border-zinc-700 rounded-xl bg-white p-2 shadow-xs flex items-center justify-center relative">
              <QrCode className="w-16 h-16 text-zinc-900" />
              <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-xl animate-pulse pointer-events-none" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>QRIS Instant Settlement</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                Scan via seluruh m-banking & e-wallet nasional. Saldo langsung masuk tanpa delay verifikasi manual.
              </p>
            </div>
          </div>
        )}

        {/* Feature Badges Footer */}
        <div className="pt-2 border-t border-[#111215]/10 dark:border-white/10 grid grid-cols-3 gap-2 text-[10px] font-mono text-gray-500 dark:text-zinc-400 text-center">
          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Anti-Selisih</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <ArrowRightLeft className="w-3 h-3 text-blue-500" />
            <span>Transfer P2P</span>
          </div>
          <div className="flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Kanonikal ID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
