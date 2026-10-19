"use client";

import { useEffect, useState } from "react";
import { Settings, ShieldCheck, Link2, Copy, Check, Server, Zap, Key, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminPengaturanPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const loadData = () => {
    fetch("/api/admin/pengaturan")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        if (d.api_key_masked) setApiKey(d.api_key_masked);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyWebhook = () => {
    if (!data?.webhook_url) return;
    navigator.clipboard.writeText(data.webhook_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload: any = {};
      if (apiKey && !apiKey.includes("***")) payload.api_key = apiKey;
      if (webhookSecret) payload.webhook_secret = webhookSecret;

      const res = await fetch("/api/admin/pengaturan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Gagal menyimpan");

      setSuccess("Pengaturan qriskuu berhasil disimpan!");
      setWebhookSecret("");
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-700 dark:text-zinc-300" />
          <span>Pengaturan Sistem & Gateway QRIS</span>
        </h1>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
          Parameter endpoint qriskuu, kredensial API Key & Webhook Secret, dan aturan batas transaksi.
        </p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs rounded-xl border border-rose-200/50 dark:border-rose-800/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Webhook Configuration Card */}
      <div className="bg-white dark:bg-[#111113] p-5 sm:p-6 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
          <span>URL Webhook qriskuu</span>
        </h2>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          Daftarkan URL ini di dashboard merchant qriskuu Anda agar notifikasi pembayaran terverifikasi otomatis.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={data?.webhook_url || "Memuat..."}
            className="flex-1 h-9 px-3 bg-gray-50/80 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg text-xs font-mono text-gray-700 dark:text-zinc-300 outline-none"
          />
          <button
            onClick={copyWebhook}
            className="h-9 px-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Tersalin!" : "Salin"}</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 dark:text-zinc-500 bg-gray-50/80 dark:bg-zinc-900/60 p-3 rounded-lg border border-gray-100 dark:border-zinc-800/60 leading-relaxed">
          &bull; Header verifikasi: <code className="font-mono text-gray-600 dark:text-zinc-400">X-Webhook-Signature</code> (HMAC-SHA256)<br />
          &bull; Perlindungan anti duplikasi: <code className="font-mono text-gray-600 dark:text-zinc-400">event_id</code> idempotency di ledger.
        </div>
      </div>

      {/* API Key Form */}
      <div className="bg-white dark:bg-[#111113] p-5 sm:p-6 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Key className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
          <span>Kredensial Gateway qriskuu</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              API Key (X-API-Key)
            </label>
            <input
              type="text"
              placeholder="xm-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Webhook Secret (HMAC Signing Secret)
            </label>
            <input
              type="password"
              placeholder={data?.has_webhook_secret ? "••••••••••••••••••••••••••••••••" : "Masukkan webhook secret"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-lg text-xs font-medium shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Simpan Kredensial</span>
          </button>
        </form>
      </div>

      {/* Gateway Status */}
      <div className="bg-white dark:bg-[#111113] p-5 sm:p-6 rounded-xl border border-gray-100 dark:border-zinc-800/80 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Server className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
          <span>Status Gateway</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 rounded-lg border border-gray-100 dark:border-zinc-800/60">
            <span className="text-gray-400 dark:text-zinc-500 block mb-1 text-[11px]">API Base URL:</span>
            <span className="font-mono font-bold text-gray-800 dark:text-zinc-200 text-xs">
              {data?.qriskuu_base_url || "https://qriskuu.web.id"}
            </span>
          </div>

          <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 rounded-lg border border-gray-100 dark:border-zinc-800/60">
            <span className="text-gray-400 dark:text-zinc-500 block mb-1 text-[11px]">Koneksi API:</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/30 px-2 py-0.5 rounded-full text-[10px]">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{data?.has_api_key ? "Live Connected" : "Simulator Mode"}</span>
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/50">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-2">Batas Transaksi (Aturan PRD):</h3>
          <ul className="text-xs text-gray-500 dark:text-zinc-400 space-y-1 list-disc list-inside">
            <li>Minimal Top Up: <strong className="text-gray-800 dark:text-zinc-200">Rp 1.000</strong> (zero fee)</li>
            <li>Maksimal Top Up: <strong className="text-gray-800 dark:text-zinc-200">Rp 1.000.000</strong> per transaksi QRIS</li>
            <li>Hitung mundur QR: <strong className="text-gray-800 dark:text-zinc-200">5 Menit</strong> dengan polling lokal otomatis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
