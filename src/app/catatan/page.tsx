"use client";

import { useEffect, useState, useRef } from "react";
import {
  BookOpen,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Trash2,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Target,
  Pencil,
} from "lucide-react";

const NAMA_BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const BULAN_PENDEK = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const KATEGORI_PENGELUARAN = [
  "Makan & Minum",
  "Transportasi & Bensin",
  "Tugas & Kuliah",
  "Belanja Kebutuhan",
  "Jajan & Hiburan",
  "Kos & Tagihan",
  "Lainnya",
];

const KATEGORI_PEMASUKAN = [
  "Uang Saku Ortu",
  "Gaji / Freelance",
  "Beasiswa",
  "Hadiah / Bonus",
  "Lainnya",
];

export default function CatatanHarianPage() {
  const [list, setList] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total_masuk: 0,
    total_keluar: 0,
    sisa_saldo: 0,
    target_tabungan: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterBulan, setFilterBulan] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  // Custom Month Picker Popover State
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(() => new Date().getFullYear());
  const monthPickerRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [tipe, setTipe] = useState<"keluar" | "masuk">("keluar");
  const [nominal, setNominal] = useState("");
  const [kategori, setKategori] = useState("Makan & Minum");
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal Target Tabungan State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [savingTarget, setSavingTarget] = useState(false);
  const [targetError, setTargetError] = useState("");

  // Close month picker popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setShowMonthPicker(false);
      }
    };
    if (showMonthPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMonthPicker]);

  const loadCatatan = async () => {
    try {
      const url = filterBulan ? `/api/student/catatan?bulan=${filterBulan}` : `/api/student/catatan`;
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        setList(d.data || []);
        setSummary(d.summary || { total_masuk: 0, total_keluar: 0, sisa_saldo: 0, target_tabungan: 0, count: 0 });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatatan();
  }, [filterBulan]);

  const handleOpenModal = (selectedType: "keluar" | "masuk") => {
    setTipe(selectedType);
    setKategori(selectedType === "keluar" ? "Makan & Minum" : "Uang Saku Ortu");
    setNominal("");
    setCatatan("");
    setTanggal(new Date().toISOString().slice(0, 10));
    setErrorMsg("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = parseInt(nominal, 10);
    if (isNaN(nom) || nom <= 0) {
      setErrorMsg("Masukkan nominal yang valid");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/student/catatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe,
          nominal: nom,
          kategori,
          catatan,
          tanggal,
        }),
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal menyimpan catatan");

      setShowModal(false);
      loadCatatan();
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan catatan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/student/catatan?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmId(null);
        loadCatatan();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = Math.max(0, parseInt(targetInput, 10) || 0);
    setSavingTarget(true);
    setTargetError("");

    try {
      const targetBulan = filterBulan || new Date().toISOString().slice(0, 7);
      const res = await fetch("/api/student/catatan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan: targetBulan,
          target_tabungan: targetVal,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Gagal memperbarui target tabungan");

      setShowTargetModal(false);
      loadCatatan();
    } catch (err: any) {
      setTargetError(err.message || "Gagal memperbarui target");
    } finally {
      setSavingTarget(false);
    }
  };

  const getFilterLabel = () => {
    if (!filterBulan) return "Semua Riwayat";
    const [y, m] = filterBulan.split("-");
    const mIdx = parseInt(m, 10) - 1;
    return `${NAMA_BULAN[mIdx]} ${y}`;
  };

  const targetNominal = summary.target_tabungan || 0;
  const progressPct = targetNominal > 0
    ? Math.min(100, Math.max(0, Math.round((summary.sisa_saldo / targetNominal) * 100)))
    : 0;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <span>Buku Kas Harian</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                Pribadi &bull; Offline Tracker
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
              Catatan mandiri pengeluaran &amp; uang saku sehari-hari (tidak memotong saldo digital SAKUNE).
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenModal("keluar")}
              className="h-9 px-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Catat Pengeluaran</span>
            </button>
            <button
              type="button"
              onClick={() => handleOpenModal("masuk")}
              className="h-9 px-3.5 rounded-xl bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat Pemasukan</span>
            </button>
          </div>
        </div>

        {/* ─── KARTU TARGET TABUNGAN BULANAN (JIKA ADA FILTER BULAN) ─── */}
        {filterBulan && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>Target Tabungan {getFilterLabel()}</span>
                    {targetNominal > 0 && (
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300">
                        {progressPct}% Tercapai
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {targetNominal > 0
                      ? "Target uang saku yang ingin Anda sisihkan bulan ini."
                      : "Tentukan target nominal uang saku yang ingin disisihkan bulan ini."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTargetInput(targetNominal > 0 ? String(targetNominal) : "");
                  setTargetError("");
                  setShowTargetModal(true);
                }}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Pencil className="w-3 h-3" />
                <span>{targetNominal > 0 ? "Ubah Target" : "Pasang Target"}</span>
              </button>
            </div>

            {targetNominal > 0 && (
              <div className="space-y-1.5 pt-1">
                {/* Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Progress Stats */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500 dark:text-zinc-400">
                    Tersisa/Terkumpul:{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Rp {summary.sisa_saldo.toLocaleString("id-ID")}
                    </strong>
                  </span>
                  <span className="text-gray-500 dark:text-zinc-400">
                    Target:{" "}
                    <strong className="text-gray-900 dark:text-zinc-100">
                      Rp {targetNominal.toLocaleString("id-ID")}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 1. Total Pemasukan */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
              <span>Total Pemasukan</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +Rp {summary.total_masuk.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* 2. Total Pengeluaran */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
              <span>Total Pengeluaran</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                -Rp {summary.total_keluar.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* 3. Sisa Uang Saku */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
              <span>Sisa Uang Saku Riil</span>
              <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  summary.sisa_saldo >= 0
                    ? "text-gray-900 dark:text-zinc-100"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                Rp {summary.sisa_saldo.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Subheader */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Riwayat Catatan ({summary.count})
            </h2>
          </div>

          {/* Custom Styled Month Selector (Tanpa Native Browser Picker) */}
          <div className="relative" ref={monthPickerRef}>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowMonthPicker((prev) => !prev)}
                className="h-8 px-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{getFilterLabel()}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showMonthPicker ? "rotate-180" : ""}`} />
              </button>

              {filterBulan && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterBulan("");
                    setShowMonthPicker(false);
                  }}
                  className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-medium text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Semua
                </button>
              )}
            </div>

            {/* Popover Custom Kalender Bulan */}
            {showMonthPicker && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl p-3 shadow-xl z-50 space-y-3">
                {/* Year Navigation */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y - 1)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold font-mono text-gray-900 dark:text-zinc-100">
                    {pickerYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerYear((y) => y + 1)}
                    className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-600 dark:text-zinc-400 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  {BULAN_PENDEK.map((mStr, idx) => {
                    const mKey = `${pickerYear}-${String(idx + 1).padStart(2, "0")}`;
                    const isSelected = filterBulan === mKey;
                    const isCurrentMonth =
                      new Date().getFullYear() === pickerYear && new Date().getMonth() === idx;

                    return (
                      <button
                        key={mStr}
                        type="button"
                        onClick={() => {
                          setFilterBulan(mKey);
                          setShowMonthPicker(false);
                        }}
                        className={`h-8 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gray-900 text-white dark:bg-white dark:text-black font-bold shadow-xs"
                            : isCurrentMonth
                            ? "border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
                            : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {mStr}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Quick Links */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      setPickerYear(now.getFullYear());
                      setFilterBulan(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
                      setShowMonthPicker(false);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterBulan("");
                      setShowMonthPicker(false);
                    }}
                    className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Semua Riwayat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List Riwayat Catatan */}
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400 font-mono">Memuat catatan...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
            <BookOpen className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto" />
            <div className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Belum ada catatan</div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500 max-w-xs mx-auto">
              Mulai catat uang masuk atau pengeluaran harian Anda agar keuangan tetap terpantau rapi.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800/80 overflow-hidden shadow-xs">
            {list.map((item) => {
              const isMasuk = item.tipe === "masuk";
              return (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-zinc-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isMasuk
                          ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isMasuk ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900 dark:text-zinc-100 truncate">
                          {item.kategori}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400">
                          {formatDate(item.tanggal)}
                        </span>
                      </div>
                      {item.catatan && (
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                          {item.catatan}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-bold font-mono ${
                        isMasuk
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isMasuk ? "+" : "-"}Rp {item.nominal.toLocaleString("id-ID")}
                    </span>

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="w-7 h-7 rounded-lg text-gray-300 hover:text-rose-600 dark:text-zinc-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* ─── MODAL INPUT CATATAN BARU ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Catat {tipe === "keluar" ? "Pengeluaran" : "Pemasukan"}</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Catatan harian pribadi mahasiswa
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Switch Tipe */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTipe("keluar");
                  setKategori("Makan & Minum");
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tipe === "keluar"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipe("masuk");
                  setKategori("Uang Saku Ortu");
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tipe === "masuk"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Pemasukan
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nominal */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="Contoh: 15000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-mono text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Kategori Chips */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Kategori
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(tipe === "keluar" ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN).map((kat) => (
                    <button
                      key={kat}
                      type="button"
                      onClick={() => setKategori(kat)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        kategori === kat
                          ? "bg-gray-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs"
                          : "border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tanggal */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Nasi padang lauk ayam"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || !nominal}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {submitting ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL ATUR TARGET TABUNGAN BULANAN ─── */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Target Tabungan</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Periode: {getFilterLabel()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTargetModal(false)}
                className="w-7 h-7 rounded-lg text-gray-400 hover:text-black dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {targetError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{targetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTarget} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Target Tabungan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  required
                  placeholder="Contoh: 500000"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-mono text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-1">
                  Isi 0 jika ingin menghapus target tabungan bulan ini.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[100000, 250000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTargetInput(String(preset))}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-zinc-800 text-[11px] font-mono text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Rp {(preset / 1000).toLocaleString("id-ID")}rb
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTarget}
                  className="h-9 px-4 bg-gray-900 hover:bg-black text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 rounded-xl text-xs font-semibold shadow-xs disabled:opacity-40 cursor-pointer"
                >
                  {savingTarget ? "Menyimpan..." : "Simpan Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ─── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
              Hapus Catatan Ini?
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Catatan yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="h-9 px-3.5 border border-gray-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-gray-700 dark:text-zinc-300"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="h-9 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
