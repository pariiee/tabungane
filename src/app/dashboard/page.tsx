"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
import { DashboardSkeleton } from "@/components/Skeletons";
import CustomSelect from "@/components/CustomSelect";
import {
  Wallet,
  QrCode,
  Send,
  Layers,
  Users,
  Trophy,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  FileText,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

  // Form states
  const [targetNim, setTargetNim] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [selectedGrupId, setSelectedGrupId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [allocNote, setAllocNote] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/student/dashboard");
      const d = await res.json();
      setData(d);
      if (d.groups?.length > 0 && !selectedGrupId) {
        setSelectedGrupId(d.groups[0].grup_id);
      }
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

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg(null);
    try {
      const res = await fetch("/api/student/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_nim: targetNim,
          amount: parseInt(transferAmount, 10),
          catatan: transferNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Transfer gagal");

      setModalMsg({
        type: "success",
        text: `Berhasil transfer Rp ${parseInt(transferAmount, 10).toLocaleString("id-ID")} ke ${resData.target_nama} (${targetNim})!`,
      });
      setTargetNim("");
      setTransferAmount("");
      setTransferNote("");
      loadData();
      setTimeout(() => {
        setShowTransferModal(false);
        setModalMsg(null);
      }, 1500);
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg(null);
    try {
      const res = await fetch("/api/student/wallet/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup_id: selectedGrupId,
          amount: parseInt(allocAmount, 10),
          catatan: allocNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Alokasi gagal");

      setModalMsg({
        type: "success",
        text: `Berhasil alokasikan Rp ${parseInt(allocAmount, 10).toLocaleString("id-ID")} ke event!`,
      });
      setAllocAmount("");
      setAllocNote("");
      loadData();
      setTimeout(() => {
        setShowAllocModal(false);
        setModalMsg(null);
      }, 1500);
    } catch (err: any) {
      setModalMsg({ type: "error", text: err.message });
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const user = data?.user;
  const kpi = data?.kpi || {};
  const chart = data?.chart || [];
  const recent = data?.recent || [];
  const groups = data?.groups || [];

  const saldoDompet = kpi.saldo_dompet || 0;
  const totalTabungan = kpi.total_tabungan || 0;

  // Chart config matching /admin
  const chartWidth = 520;
  const chartHeight = 160;
  const padX = 36;
  const padRight = 20;
  const padY = 25;

  const maxVal = Math.max(
    ...chart.map((c: any) => Math.max(c.total_masuk || 0, c.total_keluar || 0)),
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

  const lineMasuk = getPoints("total_masuk");
  const lineKeluar = getPoints("total_keluar");

  const dateStart = chart[0]?.shortDate || "01/01";
  const dateMid = chart[Math.floor(chart.length / 2)]?.shortDate || "01/07";
  const dateEnd = chart[chart.length - 1]?.shortDate || "01/14";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/30">
              ID: {user?.nomor_id || user?.nim}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-1">
            Halo, {user?.nama}
          </h1>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
            Pantau saldo saku, statistik mutasi 14 hari, dan ikuti Event Sakune.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/topup"
            className="h-9 px-4 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors inline-flex items-center gap-2 shadow-xs active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Top Up Saku</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid 2x2 di Mobile, 4 Kolom di Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 items-stretch">
        {/* Card 1: Saldo Dompet Saku */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 lg:p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
              <span className="truncate">SALDO SAKU</span>
              <Wallet className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black dark:text-white shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white mt-1.5 tabular-nums truncate min-w-0">
              Rp {saldoDompet.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              Siap pakai
            </p>
          </div>

          {/* Desktop Only Actions inside Card */}
          <div className="hidden lg:flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="flex-1 h-7 rounded-md border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAllocModal(true)}
              className="flex-1 h-7 rounded-md border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Layers className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" />
              <span>Alokasi</span>
            </button>
          </div>
        </div>

        {/* Card 2: Total di Event Sakune */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 lg:p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
              <span className="truncate">TOTAL DI EVENT</span>
              <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-black dark:text-white shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white mt-1.5 tabular-nums truncate min-w-0">
              Rp {totalTabungan.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              Seluruh event
            </p>
          </div>

          <div className="hidden lg:flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <span>Event Diikuti</span>
            <span className="font-semibold text-black dark:text-white">{groups.length} Event</span>
          </div>
        </div>

        {/* Card 3: Uang Masuk 14 Hari */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 lg:p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
              <span className="truncate">UANG MASUK (14H)</span>
              <ArrowDownLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-emerald-500 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white mt-1.5 tabular-nums truncate min-w-0">
              Rp {(kpi.total14DaysMasuk || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              14 hari terakhir
            </p>
          </div>

          <div className="hidden lg:flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <span>Periode</span>
            <span className="font-semibold text-black dark:text-white">14 Hari Terakhir</span>
          </div>
        </div>

        {/* Card 4: Uang Keluar 14 Hari */}
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 sm:p-4 lg:p-4 shadow-xs flex flex-col justify-between min-w-0">
          <div className="min-w-0">
            <div className="flex items-center justify-between text-gray-500 dark:text-zinc-400 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider gap-1">
              <span className="truncate">UANG KELUAR (14H)</span>
              <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-rose-500 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white mt-1.5 tabular-nums truncate min-w-0">
              Rp {(kpi.total14DaysKeluar || 0).toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              Event &amp; transfer keluar
            </p>
          </div>

          <div className="hidden lg:flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <span>Metode</span>
            <span className="font-semibold text-black dark:text-white">Internal Ledger</span>
          </div>
        </div>
      </div>

      {/* Tombol Transfer dan Alokasi Mobile (Tepat di bawah grid 2x2, min-h 44px) */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setShowTransferModal(true)}
          className="min-h-[44px] py-2.5 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Transfer</span>
        </button>
        <button
          type="button"
          onClick={() => setShowAllocModal(true)}
          className="min-h-[44px] py-2.5 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Alokasi</span>
        </button>
      </div>

      {/* Middle Dual-Column Section (Persis Layout /admin) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kolom Kiri: Grafik Statistik Mutasi 14 Hari */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-black dark:text-white" />
              <h2 className="text-sm font-bold text-black dark:text-white">
                Statistik Mutasi (14 Hari)
              </h2>
            </div>
            <div className="text-sm font-bold text-black dark:text-white">
              Rp {(kpi.total14DaysMasuk || 0).toLocaleString("id-ID")}
            </div>
          </div>

          {/* SVG Canvas Chart with Gradient Area & Y-Axis */}
          <div className="w-full mt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-40 overflow-visible text-[#0a0a0a] dark:text-white"
            >
              <defs>
                <linearGradient id="userAreaFill" x1="0" y1="0" x2="0" y2="1">
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

              {/* 2. Area Gradasi (Bayangan Abu Halus) */}
              {lineMasuk.polyline && (
                <polygon
                  fill="url(#userAreaFill)"
                  points={`${lineMasuk.polyline} 500,135 36,135`}
                />
              )}

              {/* 3. Dashed Line (Uang Keluar) */}
              <polyline
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={lineKeluar.polyline}
              />

              {/* 4. Solid Line (Uang Masuk) */}
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

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800/50 text-[11px] text-gray-400 dark:text-zinc-500 flex justify-between">
            <span>Total Masuk: Rp {(kpi.total14DaysMasuk || 0).toLocaleString("id-ID")}</span>
            <span>Total Keluar: Rp {(kpi.total14DaysKeluar || 0).toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Kolom Kanan: Card Riwayat Transaksi Terbaru */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-xs p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-black dark:text-white" />
              <h2 className="text-sm font-bold text-black dark:text-white">
                Transaksi Terbaru
              </h2>
            </div>
            <Link
              href="/riwayat"
              className="text-xs text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white font-medium transition-colors"
            >
              Lihat semua &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase font-semibold border-b border-gray-100 dark:border-zinc-800">
                <tr>
                  <th className="py-2 px-2 font-semibold">TIPE</th>
                  <th className="py-2 px-2 font-semibold">STATUS</th>
                  <th className="py-2 px-2 font-semibold text-right">NOMINAL</th>
                  <th className="py-2 px-2 font-semibold text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">
                      Belum ada mutasi transaksi.
                    </td>
                  </tr>
                ) : (
                  recent.map((t: any) => {
                    const isPositive = t.jumlah > 0;
                    const isSuccess = t.status === "berhasil";

                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 px-2">
                          <span className="font-semibold text-black dark:text-white block truncate max-w-[130px]">
                            {formatTrxType(t.tipe)}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-zinc-500 block truncate max-w-[130px]">
                            {new Date(t.created_at).toLocaleDateString("id-ID", { month: "short", day: "numeric" })} &bull; {t.nama_grup}
                          </span>
                        </td>

                        <td className="py-3 px-2 whitespace-nowrap">
                          {isSuccess ? (
                            <span className="bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1">
                              Berhasil
                            </span>
                          ) : (
                            <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 px-2 py-0.5 rounded-full text-[10px] font-medium">
                              {formatTrxStatus(t.status)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-2 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {isPositive ? "+" : ""}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right">
                          <button
                            onClick={() => setSelectedTrx(t)}
                            className="p-1 rounded text-gray-400 hover:text-black dark:hover:text-white"
                            title="Detail"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
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

      {/* Bottom Section: Event Sakune */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-black dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-black dark:text-white" />
              <span>Event Sakune</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Daftar event tabungan dan iuran bersama yang Anda ikuti.
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-8 text-center text-xs text-gray-400 dark:text-zinc-500 shadow-xs">
            Belum ada Event Sakune aktif yang diikuti saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g: any) => {
              const progressCapped = Math.min(g.progress_pct, 100);
              return (
                <div
                  key={g.grup_id}
                  className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-4 shadow-xs hover:border-gray-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        g.nama_kelas === "Semua Kelas"
                          ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                      }`}>
                        {g.nama_kelas === "Semua Kelas" ? "Semua Kelas" : `Kelas ${g.nama_kelas}`}
                      </span>
                      <h3 className="font-bold text-black dark:text-white text-sm mt-2">{g.nama_grup}</h3>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 border ${
                        g.is_lewat_deadline
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30"
                          : "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {g.is_lewat_deadline ? "Berakhir" : `${g.sisa_hari} hari lagi`}
                    </span>
                  </div>

                  {/* Saldo vs Target */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800/50">
                    <div>
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">Iuran Saya</div>
                      <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        Rp {g.saldo_saya.toLocaleString("id-ID")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-gray-400 dark:text-zinc-500">Target Iuran</div>
                      <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300 mt-0.5">
                        Rp {g.target_per_mahasiswa.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                      <span>Progres Iuran</span>
                      <span className="font-bold text-gray-900 dark:text-zinc-100">{g.progress_pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${progressCapped}%` }}
                      />
                    </div>
                  </div>

                  {/* Total Collected */}
                  <div className="text-[11px] text-gray-500 dark:text-zinc-400 bg-gray-50/80 dark:bg-zinc-900/60 p-2.5 rounded-lg flex justify-between items-center border border-gray-100 dark:border-zinc-800/60">
                    <span>Total Terkumpul Event:</span>
                    <span className="font-bold text-gray-900 dark:text-zinc-100">
                      Rp {g.total_terkumpul_grup.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/grup/${g.grup_id}`}
                      className="flex-1 h-8 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-3 h-3 text-amber-500" />
                      <span>Leaderboard</span>
                    </Link>
                    <Link
                      href={`/topup?grup_id=${g.grup_id}`}
                      className="flex-1 h-8 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-[11px] font-medium transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>Bayar Iuran</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal 1: Detail Transaksi */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Detail Mutasi</h3>
              <button
                onClick={() => setSelectedTrx(null)}
                className="text-gray-400 hover:text-black dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-400">ID Transaksi</span>
                <span className="font-mono text-gray-700 dark:text-zinc-300">{selectedTrx.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-400">Tipe</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{formatTrxType(selectedTrx.tipe)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-400">Nominal</span>
                <span className="font-bold text-gray-900 dark:text-zinc-100">
                  Rp {Math.abs(selectedTrx.jumlah).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-400">Status</span>
                <span className="font-semibold uppercase text-emerald-600 dark:text-emerald-400">{formatTrxStatus(selectedTrx.status)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-gray-400">Tujuan / Event</span>
                <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedTrx.nama_grup}</span>
              </div>
              {selectedTrx.catatan && (
                <div className="py-1">
                  <span className="text-gray-400 block mb-1">Catatan:</span>
                  <p className="p-2 bg-gray-50 dark:bg-zinc-900 rounded border border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300">
                    {selectedTrx.catatan}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedTrx(null)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Transfer P2P NIM */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  Transfer Saldo ke Mahasiswa
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Saldo saku Anda: Rp {saldoDompet.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setModalMsg(null);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {modalMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  ID Penerima
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 240001"
                  value={targetNim}
                  onChange={(e) => setTargetNim(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={saldoDompet}
                  required
                  placeholder="Minimal Rp 1.000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Uang print tugas / patungan"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || saldoDompet <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Alokasi ke Event Sakune */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100">
                  Alokasi Dana ke Event Sakune
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Saldo saku Anda: Rp {saldoDompet.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllocModal(false);
                  setModalMsg(null);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalMsg && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                  modalMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {modalMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{modalMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Pilih Event Sakune Tujuan
                </label>
                <CustomSelect
                  value={selectedGrupId}
                  onChange={setSelectedGrupId}
                  options={groups.map((g: any) => ({
                    value: g.grup_id,
                    label: `${g.nama_grup} (Target: Rp ${g.target_per_mahasiswa.toLocaleString("id-ID")})`,
                  }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nominal Alokasi (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={saldoDompet}
                  required
                  placeholder="Jumlah yang ingin dialokasikan"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Iuran buku kenangan / konsumsi"
                  value={allocNote}
                  onChange={(e) => setAllocNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAllocModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || saldoDompet <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Alokasikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
