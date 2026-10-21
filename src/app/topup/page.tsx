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
  saldo?: number;
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
      className={`flex min-w-0 items-center gap-3 border p-3.5 rounded-xl text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-black bg-gray-50/80 ring-1 ring-black dark:border-white dark:bg-zinc-800/80 dark:ring-white"
          : "border-gray-200 bg-white hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/50"
      }`}
    >
      <span
        className={`grid h-10 w-10 flex-none place-items-center rounded-lg border transition-colors max-[420px]:hidden ${
          checked
            ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
            : "border-gray-200 bg-gray-50 text-gray-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</b>
        <small className="line-clamp-2 text-xs leading-snug text-gray-500 dark:text-zinc-400">{desc}</small>
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
  const [amount, setAmount] = useState("25000");
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
  const n = amount === "" ? NaN : Number(amount);
  const valid = Number.isInteger(n) && n >= MIN && n <= MAX;
  const showErr = amount !== "" && !valid;
  const filtered = groups.filter((g) => g.nama_grup.toLowerCase().includes(q.toLowerCase()));

  const openList = () => {
    setQ("");
    dlgRef.current?.showModal();
    if (groups.length > 5) requestAnimationFrame(() => searchRef.current?.focus());
  };
  const closeList = () => dlgRef.current?.close();

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
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Buat QRIS instan untuk menabung. Berlaku 5 menit, tanpa biaya admin.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* ===== Kiri: Form Top Up ===== */}
        <form onSubmit={handleSubmit} noValidate className={`${box} p-5 sm:p-6`}>
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900 dark:text-zinc-100">
            <Wallet className="h-5 w-5" strokeWidth={1.8} />
            <span>Detail Top Up</span>
          </h2>

          <span id="tujuan-label" className={lbl}>
            Tujuan
          </span>
          <div role="radiogroup" aria-labelledby="tujuan-label" className="grid grid-cols-2 gap-2.5">
            <Option
              checked={dest === "wallet"}
              icon={<Wallet className="h-4 w-4" strokeWidth={1.8} />}
              title="Dompet"
              desc="Saldo pribadi, bisa dialokasikan ke event"
              onClick={() => setDest("wallet")}
            />
            <Option
              id="opsi-event"
              checked={!!selected}
              disabled={groups.length === 0}
              icon={<Layers className="h-4 w-4" strokeWidth={1.8} />}
              title={selected ? selected.nama_grup : "Event"}
              desc={
                selected
                  ? `Target ${rp(selected.target_per_mahasiswa)} · Kelas ${selected.nama_kelas}`
                  : groups.length
                  ? "Pilih event iuran"
                  : "Belum ada event aktif"
              }
              onClick={openList}
              trailing={<ChevronDown className="h-4 w-4 flex-none text-gray-400" strokeWidth={1.8} />}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={n === p}
                onClick={() => setAmount(String(p))}
                className={`h-9.5 px-3.5 rounded-xl border font-mono text-xs font-semibold transition-all cursor-pointer ${
                  n === p
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-xs"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {rp(p)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount("")}
              className="h-9.5 px-3.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Hapus
            </button>
          </div>

          <div className="mt-5">
            <label htmlFor="nominal" className={lbl}>
              Nominal (Rp)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-base font-bold text-gray-400 dark:text-zinc-500">
                Rp
              </span>
              <input
                id="nominal"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 7))}
                className="h-14 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-4 font-mono text-xl font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:ring-white"
              />
            </div>
            <p role="status" className={`mt-2 text-xs font-medium ${showErr ? "text-rose-600 dark:text-rose-400" : "text-gray-500 dark:text-zinc-400"}`}>
              {valid
                ? `${rp(n)} akan masuk ke ${selected ? selected.nama_grup : "Dompet"}.`
                : showErr
                ? `Nominal harus antara ${rp(MIN)} dan ${rp(MAX)}.`
                : `Isi nominal atau pilih salah satu di atas. Minimal ${rp(MIN)}, maksimal ${rp(MAX)}.`}
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
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-sm font-semibold text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-70 dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400 shadow-xs cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Menyiapkan invoice…</span>
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" strokeWidth={2} />
                <span>Buat QRIS</span>
              </>
            )}
          </button>
          <p className="mt-3 text-center text-[11px] text-gray-400 dark:text-zinc-500">
            Verifikasi otomatis &bull; Mendukung GoPay, ShopeePay, dan m-Banking
          </p>
        </form>

        {/* ===== Kanan: Riwayat + Petunjuk ===== */}
        <div className="grid gap-5">
          <section className={`${box} p-5 sm:p-6`}>
            <div className="mb-2 flex items-center justify-between pb-3 border-b border-gray-100 dark:border-zinc-800/60">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100">
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
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-zinc-100">
              <Info className="h-4 w-4" strokeWidth={2} />
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

      {/* ===== Popup Pilih Event (Native Dialog dengan Backdrop & Search) ===== */}
      <dialog
        ref={dlgRef}
        aria-label="Pilih event"
        onClick={(e) => e.target === dlgRef.current && closeList()}
        className="m-0 mx-auto mt-auto w-full max-w-[520px] rounded-t-3xl border border-gray-200 bg-white p-0 text-gray-900 backdrop:bg-black/50 lg:my-auto lg:rounded-2xl lg:shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
      >
        <div className="flex max-h-[80vh] flex-col p-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:max-h-[70vh]">
          <div className="mb-3 flex items-center justify-between pb-2 border-b border-gray-100 dark:border-zinc-800/80">
            <b className="text-base font-bold">Pilih Event Iuran</b>
            <button type="button" onClick={closeList} aria-label="Tutup" className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-zinc-400 transition-colors cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          {groups.length > 5 && (
            <div className="relative my-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari event…"
                aria-label="Cari event"
                className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/60 pl-9 pr-3 text-xs dark:border-zinc-800 dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
              />
            </div>
          )}

          <div role="listbox" className="mt-2 overflow-y-auto space-y-1">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">Event tidak ditemukan.</p>
            ) : (
              filtered.map((g) => {
                const pct =
                  g.saldo != null && g.target_per_mahasiswa > 0
                    ? Math.min(100, Math.round((g.saldo / g.target_per_mahasiswa) * 100))
                    : null;
                const on = g.grup_id === dest;
                return (
                  <button
                    key={g.grup_id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      setDest(g.grup_id);
                      closeList();
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors cursor-pointer ${
                      on
                        ? "bg-gray-100 dark:bg-zinc-800/80 font-bold"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block text-sm text-gray-900 dark:text-zinc-100">{g.nama_grup}</b>
                      <small className="block text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Kelas {g.nama_kelas} &bull; Target {rp(g.target_per_mahasiswa)}
                      </small>
                      {pct !== null && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full border border-gray-100 bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="h-full bg-black dark:white" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    {pct !== null && <span className="font-mono text-xs font-bold text-gray-700 dark:text-zinc-300">{pct}%</span>}
                    {on && <Check className="h-4 w-4 text-black dark:text-white shrink-0" strokeWidth={2} />}
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
