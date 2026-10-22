import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LandingDemo from "@/components/LandingDemo";
import {
  Wallet,
  QrCode,
  Trophy,
  ShieldCheck,
  Building2,
  Users,
  Layers,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Landmark,
  HelpCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdminKelas = user?.role === "admin_kelas";
  const isAdmin = isSuperAdmin || user?.role === "admin" || isAdminKelas;

  return (
    <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] text-[#111215] dark:text-[#f4f3ef] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      {/* ─── 1. TOP HUD TICKER BAR ─── */}
      <div className="border-b border-[#111215]/15 dark:border-white/10 bg-[#eae8e3]/60 dark:bg-[#131418]/60 text-[11px] font-mono tracking-tight text-[#111215]/70 dark:text-white/60">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 h-9 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span className="hidden sm:inline opacity-30">|</span>
            <span className="hidden sm:inline">TABUNGANE SISFOR v2.4</span>
            <span className="hidden md:inline opacity-30">|</span>
            <span className="hidden md:inline">IMMUTABLE LEDGER & QRIS ENGINE</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] sm:text-[11px]">
            <span>FAKULTAS ILMU KOMPUTER</span>
            <span className="opacity-30">/</span>
            <span>PRODI SISTEM INFORMASI</span>
          </div>
        </div>
      </div>

      {/* ─── 2. HERO DISPLAY SECTION ─── */}
      <section className="relative overflow-hidden border-b border-[#111215]/15 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto border-x border-[#111215]/15 dark:border-white/10 px-6 py-14 md:px-10 md:py-20 relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

          <div className="max-w-3xl relative z-10">
            {/* HUD Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#111215]/20 dark:border-white/15 bg-white/70 dark:bg-black/40 text-[10px] font-mono uppercase tracking-widest text-[#111215]/80 dark:text-white/80 mb-6 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 bg-black dark:bg-white" />
              <span>Platform Finansial Mahasiswa & Kas Kelas</span>
            </div>

            {/* Display Title with Serif Italic Accent */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] text-[#111215] dark:text-white">
              Kelola kas & tabungan{" "}
              <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
                secara transparan.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="mt-6 text-sm sm:text-base md:text-lg text-[#111215]/75 dark:text-white/70 max-w-2xl leading-relaxed">
              Bagi pos keuangan harianmu dengan <strong>Kantong Sakune</strong> (ala Bank Jago), pantau kas event kelas dengan target terukur, dan nikmati setor tunai atau QRIS otomatis berkecepatan tinggi.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="h-10 px-5 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                >
                  <span>{isAdmin ? "Buka Panel Admin" : "Buka Dashboard Mahasiswa"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="h-10 px-5 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#fitur"
                    className="h-10 px-4 rounded-lg border border-[#111215]/20 dark:border-white/20 bg-white/60 dark:bg-black/30 text-xs sm:text-sm font-medium hover:bg-white dark:hover:bg-black/60 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>Jelajahi Fitur</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </a>
                </>
              )}
              <Link
                href="/leaderboard"
                className="h-10 px-3.5 rounded-lg border border-dashed border-[#111215]/25 dark:border-white/20 text-xs sm:text-sm font-medium hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Leaderboard Kampus</span>
              </Link>
            </div>
          </div>

          {/* Interactive Virtual Card Showcase */}
          <div className="mt-12 max-w-xl">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* ─── 3. CONTINUOUS LIVE MARQUEE ANIMATION ─── */}
      <div className="marquee border-b border-[#111215]/15 dark:border-white/10 bg-[#eae8e3]/70 dark:bg-[#131418]/70 py-2.5 font-mono text-[11px] uppercase tracking-wider text-[#111215]/80 dark:text-white/80 overflow-hidden">
        <div className="marquee-track flex items-center">
          {[
            "Kantong Sakune Max 3",
            "Double-Entry Ledger",
            "Auto Reconcile QRIS",
            "Scoping 4-Tier RBAC",
            "Podium 3D Leaderboard",
            "Audit Trail Forensik",
            "Tarik Saldo E-Wallet",
            "Transfer P2P Tanpa Biaya",
            "Isolasi Jurusan & Prodi",
          ].map((item, idx) => (
            <span key={`mq1-${idx}`} className="flex items-center whitespace-nowrap px-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3" />
              {item}
            </span>
          ))}
          {[
            "Kantong Sakune Max 3",
            "Double-Entry Ledger",
            "Auto Reconcile QRIS",
            "Scoping 4-Tier RBAC",
            "Podium 3D Leaderboard",
            "Audit Trail Forensik",
            "Tarik Saldo E-Wallet",
            "Transfer P2P Tanpa Biaya",
            "Isolasi Jurusan & Prodi",
          ].map((item, idx) => (
            <span key={`mq2-${idx}`} className="flex items-center whitespace-nowrap px-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 4. SECTION FITUR UTAMA (ARTCRAFT BENTO GRID COMPACT) ─── */}
      <section id="fitur" className="border-b border-[#111215]/15 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto border-x border-[#111215]/15 dark:border-white/10">
          {/* Sticky Eyebrow Section Bar */}
          <div className="sticky top-0 z-30 border-b border-[#111215]/15 dark:border-white/10 bg-[#f4f3ef]/80 dark:bg-[#0e0f12]/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-6 py-3 md:px-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#111215]/70 dark:text-white/60">
                <span className="text-[#111215]/40 dark:text-white/40">01</span>
                <span className="mx-2 opacity-30">/</span>
                Fitur Ekosistem Kampus
              </p>
              <p className="font-mono text-[11px] opacity-40 hidden sm:block">
                Live Data · Terhubung ke Server Sisfor
              </p>
            </div>
          </div>

          {/* Section Heading */}
          <div className="px-6 py-10 md:px-10 md:py-14">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111215] dark:text-white">
              Kendali presisi yang{" "}
              <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
                tidak bisa ditawar.
              </span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#111215]/70 dark:text-white/60 max-w-xl">
              Setiap komponen dirancang proporsional, ringkas, dan fokus pada kecepatan pencatatan tanpa kompleksitas berlebihan.
            </p>
          </div>

          {/* Compact 2-Column Grid with 1px border lines */}
          <div className="grid gap-px border-t border-[#111215]/15 dark:border-white/10 bg-[#111215]/15 dark:bg-white/10 md:grid-cols-2">
            {/* Card 1: Kantong Sakune */}
            <article className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Sub-Wallet Keuangan</span>
                <span>01</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] aspect-square flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">Utama</span>
                    <div>
                      <div className="font-bold text-sm">Rp 350k</div>
                      <div className="text-[8px] opacity-70">Dompet Asli</div>
                    </div>
                    <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/20 dark:bg-black/10 w-fit">Top Up</span>
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-500/10 aspect-square flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Skripsi</span>
                    <div>
                      <div className="font-bold text-sm text-[#111215] dark:text-white">Rp 500k</div>
                      <div className="text-[8px] opacity-60">Tabungan Riset</div>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-600 dark:text-emerald-400">Pindah Saldo</span>
                  </div>
                  <div className="p-3 rounded-xl border border-blue-300/60 dark:border-blue-800/60 bg-blue-500/10 aspect-square flex flex-col justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-blue-700 dark:text-blue-400">Study Tour</span>
                    <div>
                      <div className="font-bold text-sm text-[#111215] dark:text-white">Rp 250k</div>
                      <div className="text-[8px] opacity-60">Target Rp 500k</div>
                    </div>
                    <span className="text-[8px] font-mono text-blue-600 dark:text-blue-400">50% Selesai</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111215] dark:text-white">
                    Kantong Sakune (Bank Jago Style)
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Satu Kantong Utama permanen sebagai saldo saku & penerima QRIS, plus 2 kantong kustom dengan 6 pilihan palet warna untuk memilah pos tabungan secara mandiri.
                  </p>
                </div>
              </div>
            </article>

            {/* Card 2: Tarik Saldo Dompet */}
            <article className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Pencairan Dompet</span>
                <span>02</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="p-4 rounded-xl border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30 space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="opacity-60">Min. Penarikan:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Rp 10.000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-60">Dukungan Bank:</span>
                    <span>BCA, Mandiri, BRI, BNI</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-60">Dukungan E-Wallet:</span>
                    <span>DANA, GoPay, OVO, Shopee</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="opacity-60">Alur Keamanan:</span>
                    <span className="text-zinc-600 dark:text-zinc-300">Persetujuan Admin / Hold Saldo</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111215] dark:text-white">
                    Pencairan Saldo ke Rekening & E-Wallet
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Uang saku di Dompet Utama dapat dicairkan langsung ke rekening bank atau e-wallet kapan saja melalui formulir pengajuan penarikan resmi tanpa ribet.
                  </p>
                </div>
              </div>
            </article>

            {/* Card 3: Kas & Event Kelas */}
            <article className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Event Kas Bersama</span>
                <span>03</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="p-4 rounded-xl border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30 space-y-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold">Study Tour Sistem Informasi 2026</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Rp 37.500.000</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono opacity-60">
                    <span>Target: Rp 50.000.000</span>
                    <span>75% Terkumpul · Sisa 14 Hari</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111215] dark:text-white">
                    Event Sakune & Kas Kelas Transparan
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Buka tabungan bersama kelas dengan batas waktu countdown, alokasi instan dari dompet utama, dan rekapitulasi otomatis tanpa ada selisih kas.
                  </p>
                </div>
              </div>
            </article>

            {/* Card 4: 4-Tier RBAC & Isolasi Wilayah */}
            <article className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Hierarki RBAC</span>
                <span>04</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100">DEKAN FAKULTAS</span>
                    <span className="text-[10px] opacity-60">Menaungi Semua Jurusan</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100">KAPRODI</span>
                    <span className="text-[10px] opacity-60">Scope Program Studi</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100">ADMINYA KELAS</span>
                    <span className="text-[10px] opacity-60">Kelola 1 Kelas & Setor Kas</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100">MAHASISWA</span>
                    <span className="text-[10px] opacity-60">Portal Saldo & Mutasi</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111215] dark:text-white">
                    Isolasi Hak Akses & Scoping Wilayah
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Setiap tingkatan peran hanya dapat mengakses data yang berhak ia kelola. Admin Kelas hanya mengawasi kelasnya tanpa bisa mengubah prodi atau kelas lain.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── 5. SECTION ARSITEKTUR & INTEGRITAS ─── */}
      <section className="border-b border-[#111215]/15 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto border-x border-[#111215]/15 dark:border-white/10">
          <div className="sticky top-0 z-30 border-b border-[#111215]/15 dark:border-white/10 bg-[#f4f3ef]/80 dark:bg-[#0e0f12]/80 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-6 py-3 md:px-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-[#111215]/70 dark:text-white/60">
                <span className="text-[#111215]/40 dark:text-white/40">02</span>
                <span className="mx-2 opacity-30">/</span>
                Keamanan & Arsitektur
              </p>
              <p className="font-mono text-[11px] opacity-40 hidden sm:block">
                Double-Entry Ledger Standard
              </p>
            </div>
          </div>

          <div className="px-6 py-10 md:px-10 md:py-14 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111215] dark:text-white">
              Transparansi penuh,{" "}
              <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
                tanpa celah manipulasi.
              </span>
            </h2>
          </div>

          <div className="grid gap-px border-t border-[#111215]/15 dark:border-white/10 bg-[#111215]/15 dark:bg-white/10 md:grid-cols-3">
            <div className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">01 / ARSITEKTUR</span>
              <h3 className="font-bold text-sm text-[#111215] dark:text-white">Immutable Double Ledger</h3>
              <p className="text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                Pencatatan saldo hanya menggunakan transaksi append-only. Koreksi saldo dilakukan melalui jurnal pembalik otomatis.
              </p>
            </div>
            <div className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">02 / FORENSIK</span>
              <h3 className="font-bold text-sm text-[#111215] dark:text-white">Audit Log Per-Aksi</h3>
              <p className="text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                Setiap mutasi saldo manual, reset kata sandi, dan perubahan hak akses granular dicatat permanen dalam riwayat audit kampus.
              </p>
            </div>
            <div className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">03 / PRIVASI</span>
              <h3 className="font-bold text-sm text-[#111215] dark:text-white">Kanonikal ID & Sensor Saldo</h3>
              <p className="text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                Normalisasi nomor identitas menjadi ID Pengguna seragam, disertai opsi sensor saldo publik pada leaderboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. CALL TO ACTION & FOOTER ─── */}
      <section className="border-b border-[#111215]/15 dark:border-white/10 py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#111215]/20 dark:border-white/15 bg-white/70 dark:bg-black/40 text-[10px] font-mono uppercase tracking-widest text-[#111215]/80 dark:text-white/80 mb-4">
            <span>SISTEM INFORMASI TABUNGAN KAMPUS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111215] dark:text-white">
            Mulai bangun kebiasaan menabung{" "}
            <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
              hari ini.
            </span>
          </h2>
          <p className="mt-4 text-xs sm:text-sm text-[#111215]/70 dark:text-white/60 max-w-md mx-auto">
            Bergabunglah dengan ratusan mahasiswa lainnya dalam ekosistem kas kelas yang transparan dan tertib administrasi.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href={user ? (isAdmin ? "/admin" : "/dashboard") : "/login"}
              className="h-10 px-6 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              <span>{user ? "Masuk ke Dashboard" : "Masuk dengan ID Pengguna"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8 font-mono text-[11px] text-[#111215]/60 dark:text-white/50">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111215] dark:text-white">TABUNGANE SISFOR</span>
            <span className="opacity-30">|</span>
            <span>© 2026 PRODI SISTEM INFORMASI</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/topup" className="hover:underline">Top Up QRIS</Link>
            <Link href="/leaderboard" className="hover:underline">Leaderboard</Link>
            <Link href="/login" className="hover:underline">Masuk Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
