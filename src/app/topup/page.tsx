"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Info,
  Layers,
  QrCode,
  RefreshCw,
  Search,
  Wallet,
  X,
} from "lucide-react";

type Group = {
  grup_id: string;
  nama_grup: string;
  nama_kelas: string;
  target_per_mahasiswa: number;
  total_terkumpul?: number;
  target_total?: number;
  saldo?: number;
  deadline?: string;
};

type Trx = {
  id: string;
  jumlah: number;
  status: string;
  created_at: string;
  nama_grup?: string;
};

const PRESETS = [10000, 25000, 50000, 100000];
const MIN = 1000;
const MAX = 1000000;

const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;
const formatNumber = (numStr: string) => {
  const clean = numStr.replace(/\D/g, "");
  if (!clean) return "";
  return parseInt(clean, 10).toLocaleString("id-ID");
};

const getSisaHari = (deadlineStr?: string) => {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr);
  if (isNaN(deadline.getTime())) return null;
  const now = new Date();
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "berakhir";
  if (diffDays === 0) return "hari ini";
  return `sisa ${diffDays} hari`;
};

const box = "border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111113] rounded-2xl shadow-xs";
const lbl = "mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400";
const STATUS: Record<string, string> = {
  berhasil: "Berhasil",
  pending: "Menunggu",
  expired: "Kedaluwarsa",
  canceled: "Dibatalkan",
};

function Option(props: {
  checked: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
  trailing?: React.ReactNode;
  id?: string;
}) {
  const { checked, disabled, icon, title, desc, onClick, trailing, id } = props;
  return (
    <button
      id={id}
      type="button"
      role="radio"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-w-0 items-center gap-2.5 border p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-black bg-gray-50/80 ring-1 ring-black dark:border-white dark:bg-zinc-800/80 dark:ring-white"
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/50"
      }`}
    >
      <span
        className={`grid h-8 w-8 flex-none place-items-center rounded-lg border transition-colors ${
          checked
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-gray-200 bg-gray-50 text-gray-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-xs font-bold text-gray-900 dark:text-zinc-100">{title}</b>
        <small className="block truncate text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">{desc}</small>
      </span>
      {trailing}
    </button>
  );
}

export default function TopUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [groups, setGroups] = useState<Group[]>([]);
  const [history, setHistory] = useState<Trx[]>([]);
  const [dest, setDest] = useState<string>(searchParams.get("grup_id") || "wallet");
  const [amountRaw, setAmountRaw] = useState("25000");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dlgRef = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((d) => {
        const grps: Group[] = d?.groups || [];
        setGroups(grps);
        setDest((prev) => (prev !== "wallet" && !grps.some((g) => g.grup_id === prev) ? "wallet" : prev));
      })
      .catch(() => {});
    fetch("/api/student/riwayat?tipe=topup&limit=5")
      .then((r) => r.json())
      .then((d) => setHistory(d.data || []))
      .catch(() => {});
  }, []);

  const selected = groups.find((g) => g.grup_id === dest);
  const n = amountRaw === "" ? NaN : parseInt(amountRaw, 10);
  const valid = Number.isInteger(n) && n >= MIN && n <= MAX;
  const showErr = amountRaw !== "" && !valid;
  const filtered = groups.filter((g) => g.nama_grup.toLowerCase().includes(q.toLowerCase()));

  const openList = () => {
    setQ("");
    dlgRef.current?.showModal();
    requestAnimationFrame(() => searchRef.current?.focus());
  };
  const closeList = () => dlgRef.current?.close();

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanDigits = e.target.value.replace(/\D/g, "").slice(0, 7);
    setAmountRaw(cleanDigits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grup_id: dest === "wallet" ? null : dest, amount: n }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kode QRIS");
      router.push(`/invoice/${data.trxid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kode QRIS");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-32 lg:pb-12">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-zinc-100 flex items-center gap-2.5">
          <QrCode className="w-7 h-7 text-black dark:text-white" strokeWidth={2} />
          <span>Top Up Saldo</span>
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-zinc-400">
          Buat QRIS instan untuk menabung. Berlaku 5 menit, tanpa biaya admin.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ===== Kiri: Form Top Up ===== */}
        <form onSubmit={handleSubmit} noValidate className={`${box} p-5 sm:p-6`}>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100">
            <Wallet className="h-4 w-4" strokeWidth={2} />
            <span>Detail Top Up</span>
          </h2>

          <span id="tujuan-label" className={lbl}>
            Tujuan
          </span>
          <div role="radiogroup" aria-labelledby="tujuan-label" className="grid grid-cols-2 gap-2.5">
            <Option
              checked={dest === "wallet"}
              icon={<Wallet className="h-3.5 w-3.5" strokeWidth={2} />}
              title="Dompet"
              desc="Saldo pribadi bebas alokasi"
              onClick={() => setDest("wallet")}
            />
            <Option
              id="opsi-event"
              checked={!!selected}
              disabled={groups.length === 0}
              icon={<Layers className="h-3.5 w-3.5" strokeWidth={2} />}
              title={selected ? selected.nama_grup : "Event"}
              desc={
                selected
                  ? `Kelas ${selected.nama_kelas} · Target ${rp(selected.target_per_mahasiswa)}`
                  : groups.length
                  ? "Pilih event iuran"
                  : "Belum ada event aktif"
              }
              onClick={openList}
              trailing={<ChevronDown className="h-4 w-4 flex-none text-gray-400" strokeWidth={1.8} />}
            />
          </div>

          {/* Preset Buttons (Single Row 4 Columns, Tanpa Tombol Hapus) */}
          <div className="mt-5">
            <span className={lbl}>Pilih Nominal</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={n === p}
                  onClick={() => setAmountRaw(String(p))}
                  className={`h-9 px-2 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                    n === p
                      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {rp(p)}
                </button>
              ))}
            </div>
          </div>

          {/* Input Nominal Bersih & Modern */}
          <div className="mt-5">
            <label htmlFor="nominal" className={lbl}>
              Nominal (Rp)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-bold text-gray-400 dark:text-zinc-500 pointer-events-none">
                Rp
              </span>
              <input
                id="nominal"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={formatNumber(amountRaw)}
                onChange={handleAmountChange}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-9 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
              />
              {amountRaw && (
                <button
                  type="button"
                  onClick={() => setAmountRaw("")}
                  className="absolute right-3 p-1 rounded-md text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  title="Kosongkan nominal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p role="status" className={`mt-2 text-[11px] font-medium ${showErr ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-zinc-400"}`}>
              {valid
                ? `${rp(n)} akan masuk ke ${selected ? selected.nama_grup : "Dompet"}.`
                : showErr
                ? `Nominal harus antara ${rp(MIN)} dan ${rp(MAX)}.`
                : `Minimal ${rp(MIN)}, maksimal ${rp(MAX)} per transaksi.`}
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || loading}
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Menyiapkan invoice…</span>
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" strokeWidth={2} />
                <span>Buat QRIS</span>
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[10px] text-gray-400 dark:text-zinc-500">
            Verifikasi otomatis &bull; Mendukung GoPay, ShopeePay, dan m-Banking
          </p>
        </form>

        {/* ===== Kanan: Riwayat + Petunjuk ===== */}
        <div className="grid gap-5">
          <section className={`${box} p-5 sm:p-6`}>
            <div className="mb-2 flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/60">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100">
                Riwayat Top Up QRIS
              </h2>
              <Link href="/riwayat" className="text-xs font-semibold text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white transition-colors">
                Lihat semua →
              </Link>
            </div>

            {history.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400 dark:text-zinc-500">
                Belum ada mutasi top up QRIS.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                {history.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex justify-between items-center gap-3 py-3 text-xs">
                    <div>
                      <b className="font-mono text-sm text-gray-900 dark:text-zinc-100 font-bold">
                        +{rp(t.jumlah)}
                      </b>
                      <small className="block text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                        {new Date(t.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === "berhasil"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : t.status === "pending"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                          : "bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}>
                        {STATUS[t.status] || t.status}
                      </span>
                      <small className="block text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        {t.nama_grup || "Dompet"}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={`${box} p-5 sm:p-6`}>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100">
              <Info className="h-3.5 w-3.5" strokeWidth={2} />
              <span>Petunjuk Pembayaran</span>
            </h2>
            <ul className="grid list-disc gap-1.5 pl-4 text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">
              <li>Setelah menekan Buat QRIS, kamu diarahkan ke halaman invoice berisi kode QR.</li>
              <li>QR berlaku selama 5 menit sejak diterbitkan.</li>
              <li>Saldo otomatis bertambah setelah transfer berhasil.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ===== Popup Pilih Event Sesuai Referensi Gambar ===== */}
      <dialog
        ref={dlgRef}
        aria-label="Pilih event"
        onClick={(e) => e.target === dlgRef.current && closeList()}
        className="m-0 mx-auto mt-auto w-full max-w-[500px] rounded-t-2xl border border-gray-200 bg-white p-0 text-gray-900 shadow-2xl backdrop:bg-black/50 lg:my-auto lg:rounded-xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
      >
        <div className="flex max-h-[80vh] flex-col p-5 lg:max-h-[75vh]">
          {/* Header Dialog */}
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100">Pilih event</h3>
            <button
              type="button"
              onClick={closeList}
              aria-label="Tutup"
              className="p-1 rounded-md text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar Input */}
          <div className="relative mt-1 mb-3">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              ref={searchRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari event..."
              aria-label="Cari event"
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
            />
          </div>

          {/* Event List dengan Progress Bar & Persentase Sesuai Gambar */}
          <div role="listbox" className="overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/80 pr-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">Event tidak ditemukan.</p>
            ) : (
              filtered.map((g) => {
                // Kalkulasi persentase progres
                const terkumpul = g.total_terkumpul ?? g.saldo ?? 0;
                const target = g.target_total ?? g.target_per_mahasiswa ?? 100000;
                const pct = target > 0 ? Math.min(100, Math.round((terkumpul / target) * 100)) : 0;
                const isSelected = g.grup_id === dest;

                return (
                  <button
                    key={g.grup_id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      setDest(g.grup_id);
                      closeList();
                    }}
                    className={`w-full py-3.5 px-2 text-left transition-colors cursor-pointer rounded-lg ${
                      isSelected
                        ? "bg-gray-50 dark:bg-zinc-900/80"
                        : "hover:bg-gray-50/60 dark:hover:bg-zinc-900/40"
                    }`}
                  >
                    {/* Baris Atas: Judul Event & Angka Persen */}
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-gray-900 dark:text-zinc-100 truncate">
                        {g.nama_grup}
                      </span>
                      <span className="text-xs font-bold font-mono text-gray-900 dark:text-zinc-100 shrink-0">
                        {pct}%
                      </span>
                    </div>

                    {/* Baris Tengah: Info Kelas & Target */}
                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                      Kelas {g.nama_kelas} &bull; Target {rp(g.target_per_mahasiswa)}
                      {getSisaHari(g.deadline) && ` • ${getSisaHari(g.deadline)}`}
                    </p>

                    {/* Baris Bawah: Horizontal Progress Bar */}
                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-800">
                      <div
                        className="h-full bg-black dark:bg-white transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </dialog>
    </div>
  );
}
