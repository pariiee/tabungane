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
  saldo?: number; // opsional: saldo mahasiswa di event ini (untuk bar progres di popup)
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
const box = "border border-[#e5e5e5] bg-white dark:border-zinc-800 dark:bg-zinc-950";
const lbl = "mb-2.5 block text-xs font-semibold uppercase tracking-[0.07em] text-[#555] dark:text-zinc-400";
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
      className={`flex min-w-0 items-center gap-3 border p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked
          ? "border-[#0a0a0a] bg-[#f5f5f5] dark:border-white dark:bg-zinc-900"
          : "border-[#e5e5e5] bg-white hover:bg-[#f5f5f5] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
      }`}
    >
      <span
        className={`grid h-9 w-9 flex-none place-items-center border max-[420px]:hidden ${
          checked
            ? "border-[#0a0a0a] bg-[#0a0a0a] text-white dark:border-white dark:bg-white dark:text-black"
            : "border-[#e5e5e5] bg-[#f5f5f5] dark:border-zinc-800 dark:bg-zinc-900"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block truncate text-sm font-semibold">{title}</b>
        <small className="line-clamp-2 text-xs leading-snug text-[#555] dark:text-zinc-400">{desc}</small>
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
        // grup_id dari URL yang tidak valid -> kembali ke Dompet
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
      // QR, hitung mundur, dan polling status ada di halaman invoice
      router.push(`/invoice/${data.trxid}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat kode QRIS");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-32 lg:pb-10">
      <header>
        <h1 className="text-[32px] font-bold leading-[1.15] tracking-[-0.03em] text-[#0a0a0a] dark:text-white">
          Top Up Saldo
        </h1>
        <p className="mt-1.5 text-[15px] text-[#555] dark:text-zinc-400">
          Buat QRIS instan untuk menabung. Berlaku 5 menit, tanpa biaya admin.
        </p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* ===== Kiri: form ===== */}
        <form onSubmit={handleSubmit} noValidate className={`${box} p-5 sm:p-6`}>
          <h2 className="mb-[22px] flex items-center gap-2.5 text-[17px] font-semibold">
            <Wallet className="h-5 w-5" strokeWidth={1.8} />
            Detail Top Up
          </h2>

          <span id="tujuan-label" className={lbl}>
            Tujuan
          </span>
          <div role="radiogroup" aria-labelledby="tujuan-label" className="grid grid-cols-2 gap-2.5">
            <Option
              checked={dest === "wallet"}
              icon={<Wallet className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              title="Dompet"
              desc="Saldo pribadi, bisa dialokasikan ke event"
              onClick={() => setDest("wallet")}
            />
            <Option
              id="opsi-event"
              checked={!!selected}
              disabled={groups.length === 0}
              icon={<Layers className="h-[18px] w-[18px]" strokeWidth={1.8} />}
              title={selected ? selected.nama_grup : "Event"}
              desc={
                selected
                  ? `Target ${rp(selected.target_per_mahasiswa)} · Kelas ${selected.nama_kelas}`
                  : groups.length
                  ? "Pilih event iuran"
                  : "Belum ada event aktif"
              }
              onClick={openList}
              trailing={<ChevronDown className="h-4 w-4 flex-none text-[#777]" strokeWidth={1.8} />}
            />
          </div>

          <div className="mt-[22px] flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={n === p}
                onClick={() => setAmount(String(p))}
                className={`h-[38px] border px-3.5 font-mono text-[13px] font-medium transition-colors ${
                  n === p
                    ? "border-[#0a0a0a] bg-[#f5f5f5] dark:border-white dark:bg-zinc-900"
                    : "border-[#e5e5e5] hover:bg-[#f5f5f5] dark:border-zinc-800 dark:hover:bg-zinc-900"
                }`}
              >
                {rp(p)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount("")}
              className="h-[38px] border border-[#e5e5e5] px-3.5 text-[13px] text-[#555] hover:bg-[#f5f5f5] dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Hapus
            </button>
          </div>

          <div className="mt-[26px]">
            <label htmlFor="nominal" className={lbl}>
              Nominal (Rp)
            </label>
            <input
              id="nominal"
              inputMode="numeric"
              autoComplete="off"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
              className="h-16 w-full border border-[#e5e5e5] bg-white px-[18px] font-mono text-[22px] text-[#0a0a0a] placeholder:text-[#777] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a0a0a] dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus-visible:outline-white"
            />
            <p role="status" className={`mt-2.5 text-[13px] ${showErr ? "text-red-600" : "text-[#555] dark:text-zinc-400"}`}>
              {valid
                ? `${rp(n)} akan masuk ke ${selected ? selected.nama_grup : "Dompet"}.`
                : showErr
                ? `Nominal harus antara ${rp(MIN)} dan ${rp(MAX)}.`
                : `Isi nominal atau pilih salah satu di atas. Minimal ${rp(MIN)}, maksimal ${rp(MAX)}.`}
            </p>
          </div>

          {error && (
            <div role="alert" className="mt-4 flex items-center gap-2 border border-red-200 bg-red-50 p-3 text-[13px] text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!valid || loading}
            className="mt-[22px] flex h-14 w-full items-center justify-center gap-2.5 bg-[#0a0a0a] text-base font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:bg-[#777] disabled:opacity-70 dark:bg-white dark:text-black dark:disabled:bg-zinc-600 dark:disabled:text-white"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Menyiapkan invoice…
              </>
            ) : (
              <>
                <QrCode className="h-[18px] w-[18px]" strokeWidth={1.8} />
                Buat QRIS
              </>
            )}
          </button>
          <p className="mt-3.5 text-center text-[13px] text-[#777] dark:text-zinc-500">
            Verifikasi otomatis · Mendukung GoPay, ShopeePay, dan m-Banking
          </p>
        </form>

        {/* ===== Kanan: riwayat + petunjuk ===== */}
        <div className="grid gap-5">
          {history.length > 0 && (
            <section className={`${box} p-5 sm:p-6`}>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[17px] font-semibold">Riwayat Top Up QRIS</h2>
                <Link href="/riwayat" className="text-[13px] text-[#0a0a0a] dark:text-white">
                  Lihat semua →
                </Link>
              </div>
              <ul>
                {history.slice(0, 5).map((t, i) => (
                  <li
                    key={t.id}
                    className={`justify-between gap-3 border-b border-[#e5e5e5] py-[15px] text-[13px] last:border-0 dark:border-zinc-800 ${
                      i >= 3 ? "hidden lg:flex" : "flex"
                    }`}
                  >
                    <div>
                      <b className="font-mono text-sm">+{rp(t.jumlah)}</b>
                      <small className="block text-[#777] dark:text-zinc-500">
                        {new Date(t.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                    <div className="text-right text-xs text-[#555] dark:text-zinc-400">
                      {STATUS[t.status] || t.status}
                      <br />
                      {t.nama_grup || "Dompet"}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className={`${box} p-5 sm:p-6`}>
            <h2 className="mb-3.5 flex items-center gap-2.5 text-[17px] font-semibold">
              <Info className="h-5 w-5" strokeWidth={1.8} />
              Petunjuk Pembayaran
            </h2>
            <ul className="grid list-disc gap-1.5 pl-[18px] text-[13px] text-[#555] dark:text-zinc-400">
              <li>Setelah menekan Buat QRIS, kamu diarahkan ke halaman invoice berisi kode QR.</li>
              <li>QR berlaku selama 5 menit sejak diterbitkan.</li>
              <li>Saldo otomatis bertambah setelah transfer berhasil.</li>
            </ul>
          </section>
        </div>
      </div>

      {/* ===== Popup pilih event (native <dialog>: Esc, focus trap, backdrop bawaan browser) ===== */}
      <dialog
        ref={dlgRef}
        aria-label="Pilih event"
        onClick={(e) => e.target === dlgRef.current && closeList()}
        className="m-0 mx-auto mt-auto w-full max-w-[520px] rounded-t-[20px] border border-[#e5e5e5] bg-white p-0 text-[#0a0a0a] backdrop:bg-black/45 lg:my-auto lg:rounded-sm lg:shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
      >
        <div className="flex max-h-[80vh] flex-col p-4 pb-[max(16px,env(safe-area-inset-bottom))] lg:max-h-[70vh]">
          <div className="mb-3 flex items-center justify-between">
            <b className="text-base">Pilih event</b>
            <button type="button" onClick={closeList} aria-label="Tutup" className="p-1 text-[#555] dark:text-zinc-400">
              <X className="h-5 w-5" />
            </button>
          </div>

          {groups.length > 5 && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-[18px] w-[18px] text-[#777]" />
              <input
                ref={searchRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari event…"
                aria-label="Cari event"
                className="h-11 w-full border border-[#e5e5e5] bg-white pl-10 pr-3 text-[15px] dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>
          )}

          <div role="listbox" className="mt-2 overflow-auto">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#555] dark:text-zinc-400">Event tidak ditemukan.</p>
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
                    className={`flex w-full items-center gap-3 border-b border-[#e5e5e5] px-1 py-3.5 text-left dark:border-zinc-800 ${
                      on ? "bg-[#f5f5f5] dark:bg-zinc-900" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <b className="block text-[15px]">{g.nama_grup}</b>
                      <small className="block text-xs text-[#555] dark:text-zinc-400">
                        Kelas {g.nama_kelas} · Target {rp(g.target_per_mahasiswa)}
                      </small>
                      {pct !== null && (
                        <div className="mt-2 h-1 overflow-hidden rounded-full border border-[#e5e5e5] bg-[#f5f5f5] dark:border-zinc-800 dark:bg-zinc-900">
                          <div className="h-full bg-[#0a0a0a] dark:bg-white" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    {pct !== null && <span className="font-mono text-[13px] font-bold">{pct}%</span>}
                    {on && <Check className="h-[18px] w-[18px]" strokeWidth={1.8} />}
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
