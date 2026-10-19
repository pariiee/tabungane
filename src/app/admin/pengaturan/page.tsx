"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldCheck, Link2, Copy, Check, Server, Zap } from "lucide-react";

export default function AdminPengaturanPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/admin/pengaturan")
      .then((res) => res.json())
      .then((d) => setData(d));
  }, []);

  const copyWebhook = () => {
    if (!data?.webhook_url) return;
    navigator.clipboard.writeText(data.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-600" />
          Pengaturan Sistem & Integrasi qriskuu
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Parameter endpoint qriskuu, status webhook signature, dan aturan limit transaksi.
        </p>
      </div>

      {/* Webhook Configuration Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Link2 className="w-5 h-5 text-purple-600" />
          URL Webhook qriskuu
        </h2>
        <p className="text-xs text-gray-500">
          Daftarkan URL ini di dashboard merchant qriskuu Anda agar notifikasi pembayaran sukses terverifikasi otomatis.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={data?.webhook_url || "Memuat..."}
            className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-mono text-gray-700 outline-none"
          />
          <button
            onClick={copyWebhook}
            className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Tersalin!" : "Salin"}
          </button>
        </div>

        <div className="text-[11px] text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100">
          &bull; Header verifikasi: <code className="font-mono text-gray-600">X-Webhook-Signature</code> (HMAC-SHA256)<br />
          &bull; Pencegahan duplikasi otomatis via constraint unik <code className="font-mono text-gray-600">event_id</code> di tabel webhook_events.
        </div>
      </div>

      {/* qriskuu Gateway Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Server className="w-5 h-5 text-purple-600" />
          Status Integrasi API Gateway
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-1">API Base URL:</span>
            <span className="font-mono font-bold text-gray-800">
              {data?.qriskuu_base_url || "https://api.qriskuu.com/v1"}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl">
            <span className="text-gray-400 block mb-1">Koneksi Gateway:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              {data?.connection_status === "connected"
                ? "Live Connected"
                : "Simulator Active (Dev Ready)"}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Batas Transaksi (Aturan PRD):</h3>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>Minimal Top Up: <strong>Rp1.000</strong> (tanpa fee)</li>
            <li>Maksimal Top Up: <strong>Rp1.000.000</strong> per transaksi QRIS</li>
            <li>Hitung mundur QR: <strong>5 Menit</strong> dengan polling status lokal setiap 3 detik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
