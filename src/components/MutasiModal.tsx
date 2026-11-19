"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { formatRupiah, formatTrxType } from "@/lib/format";

interface MutasiModalProps {
  student: any; // { id, nama, nomor_id|nim, nama_kelas, saldo_dompet }
  onClose: () => void;
}

type Tab = "semua" | "masuk" | "keluar";

interface Item {
  id: string;
  tipe: string;
  arah: "masuk" | "keluar";
  jumlah: number;
  catatan: string | null;
  dibuat_oleh: string | null;
  tanggal: string;
  saldo_setelah: number | null;
}

function tanggalID(iso?: string): string {
  if (!iso) return "-";
  // SQLite CURRENT_TIMESTAMP = UTC tanpa zona; tambahkan Z bila belum berzona
  const s = /[zZ]|[+-]\d{2}:?\d{2}$/.test(iso) ? iso : iso.replace(" ", "T") + "Z";
  const d = new Date(s);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export default function MutasiModal({ student, onClose }: MutasiModalProps) {
  const [tab, setTab] = useState<Tab>("semua");
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [ringkasan, setRingkasan] = useState({ masuk: 0, keluar: 0 });
  const [saldoSekarang, setSaldoSekarang] = useState<number>(Number(student?.saldo_dompet || 0));
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nama = student?.nama;
  const nomorId = student?.nomor_id || student?.nim;
  const kelas = student?.nama_kelas || "Tanpa Kelas";

  const fetchPage = useCallback(
    async (p: number, t: Tab, append: boolean) => {
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams({ page: String(p) });
        if (t !== "semua") qs.set("tipe", t);
        const res = await fetch(`/api/admin/mahasiswa/${student.id}/mutasi?${qs}`);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Gagal memuat mutasi");

        setItems((prev) => (append ? [...prev, ...json.data] : json.data));
        setHasMore(Boolean(json.has_more));
        setTotal(Number(json.total || 0));
        setRingkasan({ masuk: Number(json.ringkasan?.masuk || 0), keluar: Number(json.ringkasan?.keluar || 0) });
        setSaldoSekarang(Number(json.saldo_sekarang || 0));
        setPage(p);
      } catch (e: any) {
        setError(e?.message || "Gagal memuat mutasi");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [student?.id]
  );

  // Muat ulang tiap ganti tab
  useEffect(() => {
    setItems([]);
    fetchPage(1, tab, false);
  }, [tab, fetchPage]);

  // Esc untuk tutup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tabBtn = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
        tab === key
          ? "bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 shadow-xs"
          : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111113] border border-gray-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 p-5 pb-3 border-b border-gray-100 dark:border-zinc-800/80">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-gray-900 dark:text-zinc-100 truncate">Mutasi Saku</h3>
            <p className="text-[11px] font-mono text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
              {nama} · {nomorId} · {kelas}
            </p>
            <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              Saldo saat ini: {formatRupiah(saldoSekarang)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ringkasan + Tab */}
        <div className="px-5 py-3 space-y-2.5 border-b border-gray-100 dark:border-zinc-800/80">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400">
                Total Masuk
              </p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatRupiah(ringkasan.masuk)}</p>
            </div>
            <div className="rounded-xl border border-rose-200/50 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-400">
                Total Keluar
              </p>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{formatRupiah(ringkasan.keluar)}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl w-fit max-w-full overflow-x-auto">
            {tabBtn("semua", "Semua")}
            {tabBtn("masuk", "Masuk")}
            {tabBtn("keluar", "Keluar")}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-3 min-h-[180px]">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-zinc-800/60 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs">{error}</p>
              <button
                type="button"
                onClick={() => fetchPage(1, tab, false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Coba lagi
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <p className="text-xs text-gray-400 dark:text-zinc-500">Belum ada riwayat transaksi</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-zinc-800/80">
              {items.map((it) => {
                const masuk = it.arah === "masuk";
                return (
                  <li key={it.id} className="py-2.5 flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        masuk
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                      }`}
                    >
                      {masuk ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            masuk
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                              : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/40"
                          }`}
                        >
                          {masuk ? "Masuk" : "Keluar"}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-900 dark:text-zinc-100 truncate">
                          {formatTrxType(it.tipe)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                        {it.catatan || "-"}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500 mt-0.5">
                        {tanggalID(it.tanggal)}
                        {it.saldo_setelah !== null && ` · sisa ${formatRupiah(it.saldo_setelah)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-bold font-mono ${
                          masuk ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {masuk ? "+" : "-"}
                        {formatRupiah(it.jumlah)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!loading && !error && hasMore && (
            <div className="pt-3 pb-1 flex justify-center">
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => fetchPage(page + 1, tab, true)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
              >
                {loadingMore && <Loader2 className="w-3 h-3 animate-spin" />}
                {loadingMore ? "Memuat..." : `Muat lagi (${items.length}/${total})`}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between">
          <p className="text-[10px] font-mono text-gray-400 dark:text-zinc-500">
            {loading ? "Memuat..." : `${items.length} dari ${total} transaksi`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
