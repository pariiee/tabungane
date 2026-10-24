"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatTrxType, formatTrxStatus } from "@/lib/format";
import { DashboardSkeleton } from "@/components/Skeletons";
import CustomSelect from "@/components/CustomSelect";
import ConfirmModal from "@/components/ConfirmModal";
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
  ArrowUpRight,
  FolderPlus,
  PiggyBank,
  Plus,
  Trash2,
  ArrowLeftRight,
  Coins,
  Search,
  UserCheck
} from "lucide-react";

const POCKET_COLORS = [
  { id: "zinc", name: "Zinc", bg: "bg-zinc-500", ring: "ring-zinc-400" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { id: "blue", name: "Blue", bg: "bg-blue-500", ring: "ring-blue-400" },
  { id: "purple", name: "Purple", bg: "bg-purple-500", ring: "ring-purple-400" },
  { id: "amber", name: "Amber", bg: "bg-amber-500", ring: "ring-amber-400" },
  { id: "rose", name: "Rose", bg: "bg-rose-500", ring: "ring-rose-400" },
];

const THEME_MAP: Record<string, { bg: string; border: string; badge: string; bar: string; text: string }> = {
  zinc: {
    bg: "bg-white dark:bg-zinc-900",
    border: "border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700",
    badge: "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700",
    bar: "bg-zinc-700 dark:bg-zinc-300",
    text: "text-zinc-700 dark:text-zinc-300",
  },
  emerald: {
    bg: "bg-emerald-50/20 dark:bg-emerald-950/20",
    border: "border-emerald-200/60 dark:border-emerald-800/40 hover:border-emerald-300 dark:hover:border-emerald-700",
    badge: "bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-700/50",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-50/20 dark:bg-blue-950/20",
    border: "border-blue-200/60 dark:border-blue-800/40 hover:border-blue-300 dark:hover:border-blue-700",
    badge: "bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/50",
    bar: "bg-blue-500",
    text: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    bg: "bg-purple-50/20 dark:bg-purple-950/20",
    border: "border-purple-200/60 dark:border-purple-800/40 hover:border-purple-300 dark:hover:border-purple-700",
    badge: "bg-purple-100/70 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-300/50 dark:border-purple-700/50",
    bar: "bg-purple-500",
    text: "text-purple-600 dark:text-purple-400",
  },
  amber: {
    bg: "bg-amber-50/20 dark:bg-amber-950/20",
    border: "border-amber-200/60 dark:border-amber-800/40 hover:border-amber-300 dark:hover:border-amber-700",
    badge: "bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-300/50 dark:border-amber-700/50",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  rose: {
    bg: "bg-rose-50/20 dark:bg-rose-950/20",
    border: "border-rose-200/60 dark:border-rose-800/40 hover:border-rose-300 dark:hover:border-rose-700",
    badge: "bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300 border-rose-300/50 dark:border-rose-700/50",
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
  },
};

export default function StudentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

  // Kantong state (Kantong Sakune - Max 3)
  const [pockets, setPockets] = useState<any[]>([]);
  const [showCreatePocketModal, setShowCreatePocketModal] = useState(false);
  const [showPocketTransferModal, setShowPocketTransferModal] = useState(false);
  const [activePocket, setActivePocket] = useState<any | null>(null);
  const [newPocketName, setNewPocketName] = useState("");
  const [newPocketTarget, setNewPocketTarget] = useState("");
  const [newPocketColor, setNewPocketColor] = useState("zinc");
  const [pocketTransferMode, setPocketTransferMode] = useState<"ke_kantong" | "ke_dompet">("ke_kantong");
  const [pocketTransferAmount, setPocketTransferAmount] = useState("");
  const [pocketLoading, setPocketLoading] = useState(false);
  const [pocketError, setPocketError] = useState("");

  // Form states: Transfer P2P
  const [targetNim, setTargetNim] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [recipientSuggestions, setRecipientSuggestions] = useState<any[]>([]);
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const [transferSource, setTransferSource] = useState("dompet_utama");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");

  // Form states: Alokasi / Pindah Saldo
  const [selectedGrupId, setSelectedGrupId] = useState("");
  const [allocAmount, setAllocAmount] = useState("");
  const [allocNote, setAllocNote] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Unified Fund Movement Modal (Isi / Pindah / Tarik ke Dompet)
  const [showFundMoveModal, setShowFundMoveModal] = useState(false);
  const [fundMoveMode, setFundMoveMode] = useState<"isi_kantong" | "pindah_saldo" | "tarik_ke_dompet">("pindah_saldo");
  const [fundMoveSource, setFundMoveSource] = useState("dompet_utama");
  const [fundMoveTarget, setFundMoveTarget] = useState("");
  const [fundMoveAmount, setFundMoveAmount] = useState("");
  const [fundMoveNote, setFundMoveNote] = useState("");
  const [fundMoveLoading, setFundMoveLoading] = useState(false);
  const [fundMoveError, setFundMoveError] = useState("");

  // Withdrawal to Bank / E-Wallet Modal (Dari Dompet Utama)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMetode, setWithdrawMetode] = useState("bca");
  const [withdrawNomor, setWithdrawNomor] = useState("");
  const [withdrawNama, setWithdrawNama] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccessModal, setWithdrawSuccessModal] = useState(false);

  // Target Hapus Kantong
  const [deletePocketTarget, setDeletePocketTarget] = useState<any | null>(null);

  // Modal Bayar Iuran Event
  const [bayarIuranGrup, setBayarIuranGrup] = useState<any | null>(null);
  const [bayarIuranMethod, setBayarIuranMethod] = useState<"saldo" | "qris">("saldo");
  const [bayarIuranAmount, setBayarIuranAmount] = useState("");
  const [bayarIuranLoading, setBayarIuranLoading] = useState(false);
  const [bayarIuranMsg, setBayarIuranMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenBayarIuran = (g: any) => {
    setBayarIuranGrup(g);
    setBayarIuranMethod("saldo");
    setBayarIuranMsg(null);
    setBayarIuranAmount("");
  };

  const handleBayarIuranFromSaldo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bayarIuranGrup) return;
    const nominal = parseInt(bayarIuranAmount, 10);
    if (isNaN(nominal) || nominal <= 0) {
      setBayarIuranMsg({ type: "error", text: "Masukkan nominal pembayaran yang valid." });
      return;
    }
    if (nominal > saldoDompet) {
      setBayarIuranMsg({ type: "error", text: `Saldo dompet tidak mencukupi (Tersedia: Rp ${saldoDompet.toLocaleString("id-ID")}).` });
      return;
    }

    setBayarIuranLoading(true);
    setBayarIuranMsg(null);

    try {
      const res = await fetch("/api/student/wallet/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grup_id: bayarIuranGrup.grup_id,
          amount: nominal,
          catatan: `Iuran event ${bayarIuranGrup.nama_grup}`,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal memproses pembayaran iuran.");

      setBayarIuranMsg({
        type: "success",
        text: `Berhasil membayar iuran sebesar Rp ${nominal.toLocaleString("id-ID")} dari Dompet Saku!`,
      });
      loadData();
      setTimeout(() => {
        setBayarIuranGrup(null);
        setBayarIuranMsg(null);
        setBayarIuranAmount("");
      }, 1500);
    } catch (err: any) {
      setBayarIuranMsg({ type: "error", text: err.message || "Gagal memproses pembayaran iuran." });
    } finally {
      setBayarIuranLoading(false);
    }
  };

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [resDash, resPockets] = await Promise.all([
        fetch("/api/student/dashboard"),
        fetch("/api/student/kantong"),
      ]);
      const d = await resDash.json();
      const p = await resPockets.json();
      setData(d);
      setPockets(p.data || []);
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

  // Search recommendation for student recipient
  useEffect(() => {
    if (!targetNim || selectedRecipient) {
      setRecipientSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      if (targetNim.trim().length >= 2) {
        setSearchingRecipient(true);
        try {
          const res = await fetch(`/api/student/search?q=${encodeURIComponent(targetNim.trim())}`);
          const d = await res.json();
          setRecipientSuggestions(d.data || []);
        } catch {
          setRecipientSuggestions([]);
        } finally {
          setSearchingRecipient(false);
        }
      } else {
        setRecipientSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [targetNim, selectedRecipient]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalMsg(null);
    try {
      const targetIdentifier = selectedRecipient ? (selectedRecipient.nomor_id || selectedRecipient.username) : targetNim;
      const res = await fetch("/api/student/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_nim: targetIdentifier,
          amount: parseInt(transferAmount, 10),
          catatan: transferNote,
          sumber_id: transferSource,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Transfer gagal");

      setModalMsg({
        type: "success",
        text: `Berhasil transfer Rp ${parseInt(transferAmount, 10).toLocaleString("id-ID")} ke ${resData.target_nama} dari ${resData.sumber}!`,
      });
      setTargetNim("");
      setSelectedRecipient(null);
      setTransferAmount("");
      setTransferNote("");
      setTransferSource("dompet_utama");
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

  const handleFundMove = async (e: React.FormEvent) => {
    e.preventDefault();
    setFundMoveLoading(true);
    setFundMoveError("");
    try {
      const amount = parseInt(fundMoveAmount.replace(/\D/g, ""), 10);
      if (isNaN(amount) || amount <= 0) throw new Error("Nominal harus lebih dari 0");

      const isEventTarget = groups.some((g: any) => g.grup_id === fundMoveTarget);

      const res = await fetch("/api/student/kantong/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sumber_id: fundMoveSource,
          tujuan_id: fundMoveTarget,
          nominal: amount,
          catatan: fundMoveNote,
          tipe_tujuan: isEventTarget ? "event" : "kantong",
          is_event: isEventTarget,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal memproses perpindahan dana");

      setFundMoveAmount("");
      setFundMoveNote("");
      setShowFundMoveModal(false);
      loadData();
    } catch (err: any) {
      setFundMoveError(err.message);
    } finally {
      setFundMoveLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawError("");
    try {
      const amount = parseInt(withdrawAmount.replace(/\D/g, ""), 10);
      if (isNaN(amount) || amount < 10000) throw new Error("Minimal penarikan adalah Rp 10.000");

      const res = await fetch("/api/student/penarikan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumlah: amount,
          metode: withdrawMetode,
          nomor_tujuan: withdrawNomor,
          nama_penerima: withdrawNama,
          catatan: withdrawNote,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal membuat pengajuan penarikan");

      setWithdrawAmount("");
      setWithdrawNomor("");
      setWithdrawNama("");
      setWithdrawNote("");
      setShowWithdrawModal(false);
      setWithdrawSuccessModal(true);
      loadData();
    } catch (err: any) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleCreatePocket = async (e: React.FormEvent) => {
    e.preventDefault();
    setPocketLoading(true);
    setPocketError("");
    try {
      const res = await fetch("/api/student/kantong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newPocketName,
          target_nominal: parseInt(newPocketTarget.replace(/\D/g, "") || "0", 10),
          warna: newPocketColor,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal membuat kantong");

      setNewPocketName("");
      setNewPocketTarget("");
      setNewPocketColor("zinc");
      setShowCreatePocketModal(false);
      loadData();
    } catch (err: any) {
      setPocketError(err.message);
    } finally {
      setPocketLoading(false);
    }
  };

  const handlePocketTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePocket) return;
    setPocketLoading(true);
    setPocketError("");
    try {
      const nominal = parseInt(pocketTransferAmount.replace(/\D/g, ""), 10);
      const res = await fetch("/api/student/kantong/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kantong_id: activePocket.id,
          nominal,
          arah: pocketTransferMode,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal memproses dana kantong");

      setPocketTransferAmount("");
      setShowPocketTransferModal(false);
      loadData();
    } catch (err: any) {
      setPocketError(err.message);
    } finally {
      setPocketLoading(false);
    }
  };

  const handleConfirmDeletePocket = async () => {
    if (!deletePocketTarget) return;
    try {
      const res = await fetch(`/api/student/kantong/${deletePocketTarget.id}`, { method: "DELETE" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Gagal menghapus kantong");
      setDeletePocketTarget(null);
      loadData();
    } catch (err: any) {
      setPocketError(err.message);
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
  const totalSaldoKantong = pockets.reduce((acc: number, p: any) => acc + (p.saldo || 0), 0);
  const totalSaldoSakuAktif = saldoDompet + totalSaldoKantong;

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

  const pendingPayment = data?.pending_payment;

  return (
    <div className="space-y-6">
      {/* Pending Payment Alert Banner */}
      {pendingPayment && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  Tagihan Top Up Belum Diselesaikan
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 uppercase">
                  Pending
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Anda memiliki tagihan QRIS aktif sebesar <strong className="font-mono">Rp {pendingPayment.jumlah?.toLocaleString("id-ID")}</strong>. Silakan bayar atau batalkan terlebih dahulu.
              </p>
            </div>
          </div>
          <Link
            href={`/invoice/${pendingPayment.trxid || pendingPayment.id}`}
            className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg transition-colors shadow-xs active:scale-95"
          >
            <span>Bayar Tagihan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

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
              Rp {totalSaldoSakuAktif.toLocaleString("id-ID")}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {pockets.length > 0 ? `Dompet + ${pockets.length} Kantong` : "Dompet Utama"}
            </p>
          </div>

          {/* Desktop Only Actions inside Card: Isi Saldo & Transfer */}
          <div className="hidden lg:flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <Link
              href="/topup"
              className="flex-1 h-7 rounded-md border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <QrCode className="w-2.5 h-2.5 text-black dark:text-white" />
              <span>Isi Saldo</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowTransferModal(true)}
              className="flex-1 h-7 rounded-md border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
            >
              <Send className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
              <span>Transfer</span>
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

      {/* Tombol Mobile: Isi Saldo dan Transfer */}
      <div className="grid grid-cols-2 gap-3 lg:hidden">
        <Link
          href="/topup"
          className="min-h-[44px] py-2.5 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <QrCode className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
          <span>Isi Saldo</span>
        </Link>
        <button
          type="button"
          onClick={() => setShowTransferModal(true)}
          className="min-h-[44px] py-2.5 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-black dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Transfer</span>
        </button>
      </div>

      {/* Kantong Keuangan Mahasiswa (Kantong Sakune - Max 3 Termasuk Kantong Utama) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Kantong Sakune</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 font-semibold">
                {pockets.length + 1}/3 Kantong
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Pos keuangan terpisah untuk membagi tabungan pribadi sesuai kebutuhan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {/* 1. Kantong Utama / Dompet Pribadi (Default Permanen) */}
          <div className="bg-white dark:bg-zinc-900 border border-emerald-500/40 dark:border-emerald-500/30 rounded-xl p-4 shadow-xs flex flex-col justify-between min-h-[160px] sm:min-h-[168px] relative">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
                Kantong Utama &bull; Default
              </span>
              <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>

            <div className="my-2">
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm">Dompet Pribadi</h3>
              <div className="text-xl font-mono font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-0.5">
                Rp {saldoDompet.toLocaleString("id-ID")}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                Sumber dana utama transaksi &amp; transfer
              </p>
            </div>

            <div className="pt-2.5 border-t border-gray-100 dark:border-zinc-800/80 grid grid-cols-3 gap-1.5">
              <Link
                href="/topup"
                className="h-7.5 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-[11px] font-medium transition-colors inline-flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <QrCode className="w-3 h-3" />
                <span>Top Up</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setFundMoveMode("pindah_saldo");
                  setFundMoveSource("dompet_utama");
                  setFundMoveTarget(pockets.length > 0 ? pockets[0].id : (groups.length > 0 ? groups[0].grup_id : ""));
                  setFundMoveAmount("");
                  setFundMoveNote("");
                  setFundMoveError("");
                  setShowFundMoveModal(true);
                }}
                className="h-7.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Layers className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                <span>Pindah Saldo</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setWithdrawAmount("");
                  setWithdrawNote("");
                  setWithdrawError("");
                  setShowWithdrawModal(true);
                }}
                disabled={saldoDompet < 10000}
                className="h-7.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                title="Tarik Dana ke Rekening / E-Wallet"
              >
                <ArrowDownLeft className="w-3 h-3 text-rose-500" />
                <span>Tarik</span>
              </button>
            </div>
          </div>

          {/* 2 & 3. Kantong Tambahan Kustom */}
          {pockets.map((p) => {
            const theme = THEME_MAP[p.warna] || THEME_MAP.zinc;
            const hasTarget = p.target_nominal > 0;
            const pct = hasTarget ? Math.min(Math.round((p.saldo / p.target_nominal) * 100), 100) : null;

            return (
              <div
                key={p.id}
                className={`${theme.bg} ${theme.border} border rounded-xl p-4 shadow-xs flex flex-col justify-between min-h-[160px] sm:min-h-[168px] transition-all relative`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border font-semibold ${theme.badge}`}>
                    {hasTarget ? `Target: Rp ${p.target_nominal.toLocaleString("id-ID")}` : "Tanpa Target"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeletePocketTarget(p)}
                    className="p-1 rounded text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    title="Hapus Kantong"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-2">
                  <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm truncate">{p.nama}</h3>
                  <div className="text-xl font-mono font-bold tracking-tight text-gray-900 dark:text-zinc-100 mt-0.5">
                    Rp {p.saldo.toLocaleString("id-ID")}
                  </div>

                  {hasTarget ? (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                        <span>{pct}% tercapai</span>
                        <span>Sisa Rp {Math.max(0, p.target_nominal - p.saldo).toLocaleString("id-ID")}</span>
                      </div>
                      <div className="w-full bg-gray-200/70 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`${theme.bar} h-full rounded-full transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                      Siap dialokasikan
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-gray-100 dark:border-zinc-800/80 grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePocket(p);
                      setFundMoveMode("isi_kantong");
                      setFundMoveTarget(p.id);
                      setFundMoveSource("dompet_utama");
                      setFundMoveAmount("");
                      setFundMoveNote("");
                      setFundMoveError("");
                      setShowFundMoveModal(true);
                    }}
                    className="h-7.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Isi Saldo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePocket(p);
                      setFundMoveMode("pindah_saldo");
                      setFundMoveSource(p.id);
                      setFundMoveTarget("dompet_utama");
                      setFundMoveAmount("");
                      setFundMoveNote("");
                      setFundMoveError("");
                      setShowFundMoveModal(true);
                    }}
                    disabled={p.saldo <= 0}
                    className="h-7.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                    <span>Pindah Saldo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePocket(p);
                      setFundMoveMode("tarik_ke_dompet");
                      setFundMoveSource(p.id);
                      setFundMoveTarget("dompet_utama");
                      setFundMoveAmount(p.saldo > 0 ? String(p.saldo) : "");
                      setFundMoveNote("");
                      setFundMoveError("");
                      setShowFundMoveModal(true);
                    }}
                    disabled={p.saldo <= 0}
                    className="h-7.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[11px] font-medium text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
                    title="Tarik Saldo ke Dompet Utama"
                  >
                    <ArrowDownLeft className="w-3 h-3 text-amber-500" />
                    <span>Tarik</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Slot Tambah Kantong Baru */}
          {pockets.length < 2 && (
            <button
              type="button"
              onClick={() => {
                setPocketError("");
                setShowCreatePocketModal(true);
              }}
              className="border border-dashed border-gray-300 dark:border-zinc-800 hover:border-gray-400 dark:hover:border-zinc-700 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1.5 text-gray-400 dark:text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer min-h-[160px] sm:min-h-[168px]"
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800/80 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">+ Tambah Kantong</span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">Tersisa {2 - pockets.length} slot tambahan</span>
            </button>
          )}
        </div>
      </div>

      {/* Event Sakune (Di bawah Kantong Sakune, di atas Statistik Mutasi) */}
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
                    <button
                      type="button"
                      onClick={() => handleOpenBayarIuran(g)}
                      className="flex-1 h-8 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-[11px] font-medium transition-colors inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Bayar Iuran</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

                        <td className="py-3 px-2 text-right font-mono whitespace-nowrap">
                          {t.status === "berhasil" ? (
                            <span className={`font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                              {isPositive ? "+" : "-"}Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-400 dark:text-zinc-500">
                              Rp {Math.abs(t.jumlah).toLocaleString("id-ID")}
                            </span>
                          )}
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
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Transfer Saldo ke Mahasiswa</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Total saldo saku aktif Anda: Rp {totalSaldoSakuAktif.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setModalMsg(null);
                  setSelectedRecipient(null);
                  setRecipientSuggestions([]);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
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
              {/* STEP 1: PILIH MAHASISWA PENERIMA */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Penerima Transfer (Wajib Mahasiswa) <span className="text-rose-500">*</span>
                </label>

                {!selectedRecipient ? (
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Ketik ID, NIM, atau Username Mahasiswa..."
                        value={targetNim}
                        onChange={(e) => {
                          setTargetNim(e.target.value);
                          setSelectedRecipient(null);
                        }}
                        className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                      />
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    </div>

                    {searchingRecipient && (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Mencari mahasiswa...</span>
                      </p>
                    )}

                    {recipientSuggestions.length > 0 && !selectedRecipient && (
                      <div className="mt-1 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-lg divide-y divide-gray-100 dark:divide-zinc-800 z-20">
                        {recipientSuggestions.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecipient(s);
                              setTargetNim(s.nomor_id);
                              setRecipientSuggestions([]);
                            }}
                            className="w-full p-2.5 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div>
                              <div className="font-semibold text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                                <span>{s.nama}</span>
                                {s.username && (
                                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">@{s.username}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-zinc-400 font-mono mt-0.5">
                                ID: {s.nomor_id} &bull; {s.nama_kelas || "Mahasiswa"}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 font-medium">
                              Pilih
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {targetNim.trim().length >= 2 && !searchingRecipient && recipientSuggestions.length === 0 && (
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-1">
                        Mahasiswa dengan ID / Username tersebut tidak ditemukan.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                          {selectedRecipient.nama}
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                          ID: {selectedRecipient.nomor_id} &bull; {selectedRecipient.nama_kelas || "Mahasiswa"}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setTargetNim("");
                      }}
                      className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      Ganti
                    </button>
                  </div>
                )}
              </div>

              {/* STEP 2: 3 KOLOM SETELAH PENERIMA TERPILIH */}
              {selectedRecipient && (
                <>
                  {/* Kolom 1: Sumber Saldo */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                      1. Sumber Saldo
                    </label>
                    <CustomSelect
                      value={transferSource}
                      onChange={setTransferSource}
                      options={[
                        { value: "dompet_utama", label: `Dompet Utama (Rp ${saldoDompet.toLocaleString("id-ID")})` },
                        ...pockets.map((p: any) => ({
                          value: p.id,
                          label: `Kantong "${p.nama}" (Rp ${p.saldo.toLocaleString("id-ID")})`,
                        })),
                      ]}
                    />
                  </div>

                  {/* Kolom 2: Nominal Transfer */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                        2. Nominal Transfer (Rp) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                        Tersedia: Rp {
                          (transferSource === "dompet_utama"
                            ? saldoDompet
                            : (pockets.find((p) => p.id === transferSource)?.saldo || 0)
                          ).toLocaleString("id-ID")
                        }
                      </span>
                    </div>
                    <input
                      type="number"
                      min="1000"
                      max={
                        transferSource === "dompet_utama"
                          ? saldoDompet
                          : (pockets.find((p) => p.id === transferSource)?.saldo || 0)
                      }
                      required
                      placeholder="Minimal Rp 1.000"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono font-bold"
                    />
                  </div>

                  {/* Kolom 3: Catatan Opsional */}
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                      3. Catatan (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Misal: Uang print tugas / patungan"
                      value={transferNote}
                      onChange={(e) => setTransferNote(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedRecipient(null);
                    setRecipientSuggestions([]);
                  }}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    modalLoading ||
                    !selectedRecipient ||
                    !transferAmount ||
                    parseInt(transferAmount) < 1000 ||
                    parseInt(transferAmount) >
                      (transferSource === "dompet_utama"
                        ? saldoDompet
                        : (pockets.find((p) => p.id === transferSource)?.saldo || 0))
                  }
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Pindah Saldo */}
      {showAllocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Pindah Saldo</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Pindahkan saldo dari sumber dana ke Event Sakune.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAllocModal(false);
                  setModalMsg(null);
                }}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
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
                  Nominal yang Dipindah (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={saldoDompet}
                  required
                  placeholder="Masukkan jumlah saldo yang ingin dipindah"
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Sumber Saldo
                </label>
                <CustomSelect
                  value="dompet_utama"
                  onChange={() => {}}
                  options={[
                    { value: "dompet_utama", label: `Dompet Utama (Rp ${saldoDompet.toLocaleString("id-ID")})` },
                    ...pockets
                      .filter((p: any) => p.saldo > 0)
                      .map((p: any) => ({
                        value: p.id,
                        label: `${p.nama} (Rp ${p.saldo.toLocaleString("id-ID")})`,
                      })),
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Event Sakune Tujuan <span className="text-rose-500">*</span>
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
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || saldoDompet <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Pindahkan Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal 4: Buat Kantong Baru */}
      {showCreatePocketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Buat Kantong Sakune Baru</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Slot kantong tambahan tersisa: {2 - pockets.length} dari maksimal 3 kantong (termasuk Kantong Utama).
                </p>
              </div>
              <button
                onClick={() => setShowCreatePocketModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {pocketError && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pocketError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePocket} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nama Kantong <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tabungan Buku, Dana Liburan, Wishlist"
                  value={newPocketName}
                  onChange={(e) => setNewPocketName(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Target Nominal Tabungan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Kosongkan jika tanpa target nominal"
                  value={newPocketTarget ? parseInt(newPocketTarget.replace(/\D/g, "") || "0").toLocaleString("id-ID") : ""}
                  onChange={(e) => setNewPocketTarget(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1.5">
                  Palet Warna Visual Kartu
                </label>
                <div className="flex items-center gap-2.5 pt-0.5">
                  {POCKET_COLORS.map((c) => {
                    const isSelected = newPocketColor === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewPocketColor(c.id)}
                        className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "ring-2 ring-offset-2 ring-black dark:ring-white dark:ring-offset-zinc-900 scale-110 shadow-xs"
                            : "opacity-60 hover:opacity-100"
                        }`}
                        title={c.name}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreatePocketModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pocketLoading || !newPocketName.trim()}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {pocketLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Kantong</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: Perpindahan Dana Fleksibel (Isi / Pindah / Tarik ke Dompet) */}
      {showFundMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>
                    {fundMoveMode === "isi_kantong"
                      ? `Isi Saldo: ${activePocket?.nama}`
                      : fundMoveMode === "tarik_ke_dompet"
                      ? `Tarik Saldo: ${activePocket?.nama} ke Dompet`
                      : "Pindah Saldo"}
                  </span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Atur alokasi pos keuangan Anda secara langsung.
                </p>
              </div>
              <button
                onClick={() => setShowFundMoveModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {fundMoveError && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fundMoveError}</span>
              </div>
            )}

            <form onSubmit={handleFundMove} className="space-y-3">
              {/* 1. NOMINAL */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="0"
                  value={fundMoveAmount ? parseInt(fundMoveAmount.replace(/\D/g, "") || "0").toLocaleString("id-ID") : ""}
                  onChange={(e) => setFundMoveAmount(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono font-bold"
                />
              </div>

              {/* 2. SUMBER SALDO */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Sumber Saldo
                </label>
                {fundMoveMode === "isi_kantong" ? (
                  <CustomSelect
                    value={fundMoveSource}
                    onChange={setFundMoveSource}
                    options={[
                      { value: "dompet_utama", label: `Dompet Utama (Rp ${saldoDompet.toLocaleString("id-ID")})` },
                      ...pockets
                        .filter((p: any) => p.id !== activePocket?.id && p.saldo > 0)
                        .map((p: any) => ({
                          value: p.id,
                          label: `Kantong "${p.nama}" (Rp ${p.saldo.toLocaleString("id-ID")})`,
                        })),
                    ]}
                  />
                ) : (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-xs text-gray-700 dark:text-zinc-300 font-medium">
                    {fundMoveSource === "dompet_utama"
                      ? `Dompet Utama (Rp ${saldoDompet.toLocaleString("id-ID")})`
                      : `Kantong "${activePocket?.nama}" (Rp ${(activePocket?.saldo || 0).toLocaleString("id-ID")})`}
                  </div>
                )}
              </div>

              {/* 3. TUJUAN SALDO */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Tujuan Saldo
                </label>
                {fundMoveMode === "isi_kantong" ? (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-xs text-gray-700 dark:text-zinc-300 font-medium">
                    Kantong "{activePocket?.nama}"
                  </div>
                ) : fundMoveMode === "tarik_ke_dompet" ? (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-xs text-gray-700 dark:text-zinc-300 font-medium">
                    Dompet Utama
                  </div>
                ) : (
                  <CustomSelect
                    value={fundMoveTarget}
                    onChange={setFundMoveTarget}
                    options={[
                      ...(fundMoveSource !== "dompet_utama"
                        ? [{ value: "dompet_utama", label: "Dompet Utama (Pribadi)" }]
                        : []),
                      ...pockets
                        .filter((p: any) => p.id !== fundMoveSource)
                        .map((p: any) => ({
                          value: p.id,
                          label: `Kantong "${p.nama}"`,
                        })),
                      ...groups.map((g: any) => ({
                        value: g.grup_id,
                        label: `Event Sakune: ${g.nama_grup}`,
                      })),
                    ]}
                  />
                )}
              </div>

              {/* 4. CATATAN OPSIONAL */}
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Iuran / Tabungan"
                  value={fundMoveNote}
                  onChange={(e) => setFundMoveNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowFundMoveModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={fundMoveLoading || !fundMoveAmount || parseInt(fundMoveAmount) <= 0}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {fundMoveLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {fundMoveMode === "isi_kantong"
                      ? "Isi Kantong"
                      : fundMoveMode === "tarik_ke_dompet"
                      ? "Tarik ke Dompet"
                      : "Pindahkan Saldo"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Tarik Saldo Dompet Utama ke Rekening / E-Wallet */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                  <span>Tarik Dana ke Rekening / E-Wallet</span>
                </h3>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                  Saldo Dompet Utama Anda: Rp {saldoDompet.toLocaleString("id-ID")}
                </p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 border bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Metode Pencairan <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={withdrawMetode}
                  onChange={setWithdrawMetode}
                  options={[
                    { value: "bca", label: "Bank BCA" },
                    { value: "bri", label: "Bank BRI" },
                    { value: "mandiri", label: "Bank Mandiri" },
                    { value: "bni", label: "Bank BNI" },
                    { value: "dana", label: "DANA" },
                    { value: "gopay", label: "GoPay" },
                    { value: "ovo", label: "OVO" },
                    { value: "shopeepay", label: "ShopeePay" },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nomor Rekening / HP E-Wallet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1234567890 / 08123456789"
                  value={withdrawNomor}
                  onChange={(e) => setWithdrawNomor(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Nama Pemilik Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama sesuai buku tabungan / e-wallet"
                  value={withdrawNama}
                  onChange={(e) => setWithdrawNama(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                    Nominal Penarikan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                    Min Rp 10.000 &bull; Maks Rp {saldoDompet.toLocaleString("id-ID")}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Minimal Rp 10.000"
                  value={withdrawAmount ? parseInt(withdrawAmount.replace(/\D/g, "") || "0").toLocaleString("id-ID") : ""}
                  onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-zinc-300 block mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Keterangan keperluan penarikan"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={withdrawLoading || !withdrawAmount || parseInt(withdrawAmount) < 10000 || parseInt(withdrawAmount) > saldoDompet}
                  className="flex-1 h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  {withdrawLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Ajukan Penarikan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Sukses Pengajuan Penarikan Dana */}
      {withdrawSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-base">Pengajuan Berhasil Dibuat</h3>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Permintaan penarikan saldo Anda telah diterima sistem dan sedang menunggu verifikasi &amp; transfer dari Admin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawSuccessModal(false)}
              className="w-full h-9 rounded-lg bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL BAYAR IURAN EVENT (Saldo vs QRIS) ─── */}
      {bayarIuranGrup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Bayar Iuran: {bayarIuranGrup.nama_grup}</span>
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                  Pilih metode pembayaran iuran kas event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBayarIuranGrup(null);
                  setBayarIuranMsg(null);
                }}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-zinc-100 inline-flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification message */}
            {bayarIuranMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  bayarIuranMsg.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {bayarIuranMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{bayarIuranMsg.text}</span>
              </div>
            )}

            {/* Tab Pilihan Metode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
              <button
                type="button"
                onClick={() => setBayarIuranMethod("saldo")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  bayarIuranMethod === "saldo"
                    ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Potong Saldo Utama</span>
              </button>
              <button
                type="button"
                onClick={() => setBayarIuranMethod("qris")}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  bayarIuranMethod === "qris"
                    ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Top Up QRIS Instan</span>
              </button>
            </div>

            {/* TAB CONTENT 1: POTONG SALDO UTAMA */}
            {bayarIuranMethod === "saldo" && (
              <form onSubmit={handleBayarIuranFromSaldo} className="space-y-3.5">
                {/* Info Saldo Tersedia */}
                <div className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-zinc-400 flex items-center gap-1">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Saldo Dompet Tersedia</span>
                    </span>
                    <span className="font-bold font-mono text-gray-900 dark:text-zinc-100">
                      Rp {saldoDompet.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60 dark:border-zinc-800/60">
                    <span className="text-gray-500 dark:text-zinc-400">Sisa Target Iuran Anda</span>
                    <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
                      Rp {Math.max(0, (bayarIuranGrup.target_per_mahasiswa || 0) - (bayarIuranGrup.saldo_saya || 0)).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Input Nominal */}
                <div>
                  <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Nominal yang Ingin Dipotong (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    required
                    placeholder="Contoh: 10000"
                    value={bayarIuranAmount}
                    onChange={(e) => setBayarIuranAmount(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-mono text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                  />
                </div>

                {/* Warning jika saldo tidak cukup */}
                {parseInt(bayarIuranAmount || "0", 10) > saldoDompet && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      Saldo Dompet Utama Anda (Rp {saldoDompet.toLocaleString("id-ID")}) tidak mencukupi untuk memotong Rp {parseInt(bayarIuranAmount || "0", 10).toLocaleString("id-ID")}. Silakan isi saldo atau gunakan opsi QRIS.
                    </span>
                  </div>
                )}

                {/* Form Buttons */}
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setBayarIuranGrup(null);
                      setBayarIuranMsg(null);
                    }}
                    className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      bayarIuranLoading ||
                      !bayarIuranAmount ||
                      parseInt(bayarIuranAmount, 10) <= 0 ||
                      parseInt(bayarIuranAmount, 10) > saldoDompet
                    }
                    className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    {bayarIuranLoading
                      ? "Memproses..."
                      : parseInt(bayarIuranAmount || "0", 10) > saldoDompet
                      ? "Saldo Tidak Cukup"
                      : `Potong Saldo (Rp ${parseInt(bayarIuranAmount || "0", 10).toLocaleString("id-ID")})`}
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 2: TOP UP QRIS INSTAN */}
            {bayarIuranMethod === "qris" && (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center mx-auto shadow-xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                      Scan QRIS Semua Bank & E-Wallet
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                      Bayar langsung menggunakan BCA, BRI, Mandiri, BNI, ShopeePay, GoPay, atau DANA. Dana akan otomatis tercatat ke event ini.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setBayarIuranGrup(null);
                      setBayarIuranMsg(null);
                    }}
                    className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <Link
                    href={`/topup?grup_id=${bayarIuranGrup.grup_id}`}
                    className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Lanjut Buat Tagihan QRIS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Confirm Modal: Hapus Kantong */}
      <ConfirmModal
        isOpen={Boolean(deletePocketTarget)}
        onClose={() => setDeletePocketTarget(null)}
        onConfirm={handleConfirmDeletePocket}
        title="Hapus Kantong Sakune?"
        message={
          deletePocketTarget?.saldo > 0
            ? `Hapus kantong "${deletePocketTarget?.nama}"? Seluruh sisa saldo sebesar Rp ${deletePocketTarget?.saldo.toLocaleString("id-ID")} akan otomatis dikembalikan ke Dompet Utama Anda.`
            : `Apakah Anda yakin ingin menghapus kantong "${deletePocketTarget?.nama}"?`
        }
        confirmText="Ya, Hapus Kantong"
        isDestructive={true}
      />
    </div>
  );
}
