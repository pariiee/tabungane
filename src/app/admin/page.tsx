"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
import { DashboardSkeleton } from "@/components/Skeletons";
import {
  TrendingUp,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Inbox,
  Bookmark,
  Clock,
  XCircle,
  FileText,
  X
} from "lucide-react";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const kpi = data?.kpi || {};
  const chart = data?.chart || [];
  const recent = data?.recent || [];

  // SVG Chart dimensions
  const chartWidth = 520;
  const chartHeight = 160;
  const padX = 36;
  const padRight = 20;
  const padY = 25;

  const maxVal = Math.max(
    ...chart.map((c: any) => Math.max(c.total_amount || 0, c.paid_amount || 0)),
    1000
  );

  const formatShortVal = (val: number) => {
    if (val >= 1_000_000) {
      const v = val / 1_000_000;
      return (Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")) + "jt";
    }
    if (val >= 1_000) {
      const v = val / 1_000;
      return (Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",")) + "rb";
    }
    return val.toString();
  };

  const getPoints = (key: string) => {
    if (chart.length === 0) return { polyline: "", dots: [] as { x: number; y: number }[] };
    const stepX = (chartWidth - padRight - padX) / (chart.length - 1);
    const dots: { x: number; y: number }[] = [];
    const polyline = chart
      .map((item: any, i: number) => {
        const x = padX + i * stepX;
        const val = item[key] || 0;
        const y = chartHeight - padY - (val / maxVal) * (chartHeight - padY * 2);
        dots.push({ x, y });
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return { polyline, dots };
  };

  const lineMasuk = getPoints("total_amount");
  const linePaid = getPoints("paid_amount");

  // 3 Dates for X Axis
  const dateStart = chart[0]?.shortDate || "10/05";
  const dateMid = chart[Math.floor(chart.length / 2)]?.shortDate || "10/11";
  const dateEnd = chart[chart.length - 1]?.shortDate || "10/18";

  return (
    <div className="space-y-6">
      {/* Header Halaman (Layout Referensi) */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Overview
          </h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Pantau saldo tabungan, progres event Sakune, dan pembayaran QRIS mahasiswa.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 KPI Cards Grid 2x2 di Mobile, 4 Kolom di Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 items-stretch">
        {/* Card 1: SETORAN HARI INI */}
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
            <span className="truncate">SETORAN HARI INI</span>
            <Inbox className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black dark:text-white shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight tabular-nums truncate min-w-0">
              Rp {kpi.today_revenue?.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {kpi.today_paid_count} setoran lunas
            </div>
          </div>
        </div>

        {/* Card 2: TOTAL DANA TERKUMPUL */}
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
            <span className="truncate">TOTAL DANA</span>
            <Bookmark className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black dark:text-white shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight tabular-nums truncate min-w-0">
              Rp {kpi.total_revenue?.toLocaleString("id-ID")}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {kpi.total_paid_count} setoran lunas
            </div>
          </div>
        </div>

        {/* Card 3: MENUNGGU PEMBAYARAN */}
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
            <span className="truncate">MENUNGGU</span>
            <Clock className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-amber-500 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight tabular-nums truncate min-w-0">
              {kpi.pending_count}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {kpi.total_trx_count} percobaan trx
            </div>
          </div>
        </div>

        {/* Card 4: MAHASISWA & KELAS */}
        <div className="bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between min-w-0">
          <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
            <span className="truncate">MAHASISWA</span>
            <XCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-500 shrink-0" />
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-bold text-black dark:text-white tracking-tight tabular-nums truncate min-w-0">
              {kpi.total_mahasiswa}
            </div>
            <div className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {kpi.total_kelas} kelas terdaftar
            </div>
          </div>
        </div>
      </div>

      {/* Dua Kolom Berdampingan: Kiri Grafik, Kanan Tabel (Identik Referensi) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Last 14 days */}
        <div className="bg-white dark:bg-zinc-900 border border-[#e5e5e5] dark:border-zinc-800 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-black dark:text-white" />
              <h2 className="text-[18px] font-semibold text-black dark:text-white">
                Last 14 days
              </h2>
            </div>
            <div className="text-[16px] font-mono font-bold text-black dark:text-white">
              Rp {kpi.total_14_days?.toLocaleString("id-ID")}
            </div>
          </div>

          {/* SVG Dual-Series Chart with Gradient Area & Y-Axis */}
          <div className="w-full mt-4">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-40 overflow-visible text-[#0a0a0a] dark:text-white"
            >
              <defs>
                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="currentColor" stopOpacity="0.22" />
                  <stop offset="1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* 1. Gridlines & Sumbu Y (di kiri, 11px, warna #777, rata kiri) */}
              <text x="0" y="29" fill="#777" className="text-[11px] font-sans" textAnchor="start">
                {formatShortVal(maxVal)}
              </text>
              <line
                x1="36"
                y1="25"
                x2="500"
                y2="25"
                stroke="#e3e3e3"
                className="dark:stroke-zinc-800"
                strokeDasharray="3 4"
                strokeWidth="1"
              />

              <text x="0" y="84" fill="#777" className="text-[11px] font-sans" textAnchor="start">
                {formatShortVal(Math.round(maxVal / 2))}
              </text>
              <line
                x1="36"
                y1="80"
                x2="500"
                y2="80"
                stroke="#e3e3e3"
                className="dark:stroke-zinc-800"
                strokeDasharray="3 4"
                strokeWidth="1"
              />

              <text x="0" y="139" fill="#777" className="text-[11px] font-sans" textAnchor="start">
                0
              </text>
              <line
                x1="36"
                y1="135"
                x2="500"
                y2="135"
                stroke="#e3e3e3"
                className="dark:stroke-zinc-800"
                strokeDasharray="3 4"
                strokeWidth="1"
              />

              {/* 2. Area Gradasi */}
              {lineMasuk.polyline && (
                <polygon
                  fill="url(#areaFill)"
                  points={`${lineMasuk.polyline} 500,135 36,135`}
                />
              )}

              {/* 3. Garis Putus-putus (linePaid) */}
              <polyline
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePaid.polyline}
              />

              {/* 4. Garis Solid (lineMasuk) di atasnya */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={lineMasuk.polyline}
              />

              {/* 5. Titik-titik per data point tanpa ring */}
              {lineMasuk.polyline
                ? lineMasuk.polyline.split(" ").map((pt: string, i: number) => {
                    const [cx, cy] = pt.split(",");
                    return (
                      <circle
                        key={i}
                        cx={cx}
                        cy={cy}
                        r="2.5"
                        fill="currentColor"
                      />
                    );
                  })
                : null}
            </svg>

            {/* Sumbu X: 3 Tanggal, rapat ke grafik mt-1 */}
            <div className="flex justify-between text-[11px] text-[#777] mt-1 pl-[36px] pr-[20px]">
              <span>{dateStart}</span>
              <span>{dateMid}</span>
              <span>{dateEnd}</span>
            </div>
          </div>

          {/* Keterangan Bawah: Teks 14px #555, margin atas 20px, tanpa garis border-t */}
          <div className="mt-5 text-[14px] text-[#555] dark:text-zinc-400">
            Total setoran masuk (solid) vs setoran berhasil (putus-putus)
          </div>
        </div>

        {/* Kolom Kanan: Transaksi Terbaru */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-black dark:text-white" />
              <h2 className="text-sm font-bold text-black dark:text-white">
                Transaksi Terbaru
              </h2>
            </div>
            <Link
              href="/admin/transaksi"
              className="text-xs text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-semibold border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2 px-2 font-semibold">ID</th>
                  <th className="py-2 px-2 font-semibold">MAHASISWA</th>
                  <th className="py-2 px-2 font-semibold">STATUS</th>
                  <th className="py-2 px-2 font-semibold">NOMINAL</th>
                  <th className="py-2 px-2 font-semibold">WAKTU</th>
                  <th className="py-2 px-2 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 dark:text-zinc-500">
                      Belum ada mutasi transaksi yang tercatat.
                    </td>
                  </tr>
                ) : (
                  recent.map((t: any) => {
                    const isPaid = t.status === "berhasil" || t.status === "paid";
                    const isPending = t.status === "pending";

                    return (
                      <tr key={t.id} className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40">
                        {/* ID: lowercase monospace */}
                        <td className="py-3 px-2 font-mono text-gray-700 dark:text-zinc-300">
                          {t.display_id}
                        </td>

                        {/* Mahasiswa info */}
                        <td className="py-3 px-2">
                          <span className="font-semibold text-black dark:text-white block truncate max-w-[120px]">
                            {t.nama_mahasiswa}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 block">
                            {t.nim}
                          </span>
                        </td>

                        {/* STATUS */}
                        <td className="py-3 px-2 whitespace-nowrap">
                          {isPaid ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" />
                              Berhasil
                            </span>
                          ) : isPending ? (
                            <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </span>
                          ) : t.status === "expired" ? (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Kedaluwarsa
                            </span>
                          ) : (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                              <X className="w-3 h-3" />
                              Dibatalkan
                            </span>
                          )}
                        </td>

                        {/* NOMINAL */}
                        <td className="py-3 px-2 whitespace-nowrap font-mono">
                          {isPaid ? (
                            <span className={`font-bold ${t.jumlah > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {t.jumlah > 0 ? "+" : "-"}Rp {Math.abs(t.jumlah || 0).toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-400 dark:text-zinc-500">
                              Rp {Math.abs(t.jumlah || 0).toLocaleString("id-ID")}
                            </span>
                          )}
                        </td>

                        {/* WAKTU: Format ringkas */}
                        <td className="py-3 px-2 text-gray-500 dark:text-zinc-400 whitespace-nowrap">
                          {new Date(t.created_at).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        {/* AKSI: 2 icon ghost buttons */}
                        <td className="py-3 px-2 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(t.qris_trx_id || t.id)}
                              title="Salin ID Transaksi"
                              className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {copiedId === (t.qris_trx_id || t.id) ? (
                                <Check className="w-3.5 h-3.5 text-black dark:text-white" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* External link / View details button */}
                            <button
                              onClick={() => setSelectedTrx(t)}
                              title="Buka Detail Transaksi"
                              className="p-1 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Transaksi */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-5 shadow-lg border border-gray-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-black dark:text-white">
                Detail Transaksi
              </h3>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">ID Transaksi:</span>
                <span className="font-mono font-medium text-black dark:text-white">
                  {selectedTrx.qris_trx_id || selectedTrx.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">Mahasiswa:</span>
                <span className="font-semibold text-black dark:text-white">
                  {selectedTrx.nama_mahasiswa} ({selectedTrx.nim})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">Grup Tabungan:</span>
                <span className="font-medium text-black dark:text-white">
                  {selectedTrx.nama_grup}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">Metode / Tipe:</span>
                <span className="font-medium text-black dark:text-white">
                  {formatTrxType(selectedTrx.tipe)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">Nominal:</span>
                <span className="font-bold text-black dark:text-white">
                  Rp {selectedTrx.jumlah?.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50 dark:border-zinc-800/60">
                <span className="text-gray-400 dark:text-zinc-500">Status:</span>
                <span className="font-semibold text-black dark:text-white">
                  {formatTrxStatus(selectedTrx.status)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400 dark:text-zinc-500">Waktu:</span>
                <span className="text-black dark:text-white">
                  {new Date(selectedTrx.created_at).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedTrx(null)}
                className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
