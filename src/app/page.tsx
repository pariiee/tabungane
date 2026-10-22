import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LandingDemo from "@/components/LandingDemo";
import ArtcraftScrollChoreo from "@/components/ArtcraftScrollChoreo";
import HeroVisualArt from "@/components/HeroVisualArt";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Wallet,
  QrCode,
  Trophy,
  ShieldCheck,
  Building2,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Landmark,
  FileText,
  Lock,
  ChevronRight,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdminKelas = user?.role === "admin_kelas";
  const isAdmin = isSuperAdmin || user?.role === "admin" || isAdminKelas;

  return (
    <div className="min-h-screen bg-[#f4f3ef] dark:bg-[#0e0f12] text-[#111215] dark:text-[#f4f3ef] selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black font-sans">
      <ArtcraftScrollChoreo />
      {/* ─── 1. TOP HUD TICKER BAR ─── */}
      <div className="border-b border-[#111215]/15 dark:border-white/10 bg-[#eae8e3]/80 dark:bg-[#131418]/80 backdrop-blur-xs text-[11px] font-mono tracking-tight text-[#111215]/70 dark:text-white/60">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 md:px-10 h-10 flex items-center justify-between whitespace-nowrap overflow-hidden select-none">
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>SYSTEM ACTIVE</span>
            </span>
            <span className="hidden sm:inline opacity-25">|</span>
            <span className="hidden sm:inline font-semibold text-[#111215] dark:text-white">SAKUNE SISFOR v2.4</span>
            <span className="hidden md:inline opacity-25">|</span>
            <span className="hidden md:inline opacity-70">IMMUTABLE LEDGER &amp; QRIS ENGINE</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="sm:hidden font-mono text-[10px] text-[#111215]/80 dark:text-white/80">
                FIK · SISFOR
              </span>
              <span className="hidden lg:inline">FAKULTAS ILMU KOMPUTER</span>
              <span className="hidden lg:inline opacity-25">/</span>
              <span className="hidden sm:inline">PRODI SISTEM INFORMASI</span>
            </div>
            <span className="opacity-25">|</span>
            <ThemeToggle className="w-6 h-6 hover:bg-black/5 dark:hover:bg-white/10" />
          </div>
        </div>
      </div>

      {/* ─── 2. HERO DISPLAY SECTION (WITH COMPONENT ART) ─── */}
      <section className="relative overflow-hidden border-b border-[#111215]/15 dark:border-white/10">
        <div className="max-w-[1280px] mx-auto border-x border-[#111215]/15 dark:border-white/10 px-6 py-12 md:px-10 md:py-16 relative">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
            {/* Left Column: Headlines & CTA */}
            <div data-reveal-group="true" className="lg:col-span-7 space-y-5">
              {/* HUD Eyebrow Tag */}
              <div data-reveal="true" className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#111215]/20 dark:border-white/15 bg-white/70 dark:bg-black/40 text-[10px] font-mono uppercase tracking-widest text-[#111215]/80 dark:text-white/80 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 bg-black dark:bg-white" />
                <span>Platform Finansial Mahasiswa & Kas Kelas</span>
              </div>

              {/* Display Title with Serif Italic Accent */}
              <h1 data-reveal="true" className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.08] text-[#111215] dark:text-white">
                Kelola kas & tabungan{" "}
                <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
                  secara transparan.
                </span>
              </h1>

              {/* Sub-headline */}
              <p data-reveal="true" className="text-sm sm:text-base text-[#111215]/75 dark:text-white/70 max-w-xl leading-relaxed">
                Bagi pos keuangan harianmu dengan <strong>Kantong Sakune</strong>, kelola iuran kas kegiatan bersama tanpa risiko selisih, dan nikmati setor tunai atau QRIS otomatis berkecepatan tinggi.
              </p>

              {/* Actions */}
              <div data-reveal="true" className="flex flex-wrap items-center gap-3 pt-2">
                {user ? (
                  <Link
                    href={isAdmin ? "/admin" : "/dashboard"}
                    className="h-10 px-5 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>{isAdmin ? "Buka Panel Admin" : "Buka Dashboard Mahasiswa"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="h-10 px-5 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] font-medium text-xs sm:text-sm hover:opacity-90 transition-opacity inline-flex items-center gap-2 cursor-pointer"
                    >
                      <span>Masuk ke Akun</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href="#fitur"
                      className="h-10 px-4 rounded-lg border border-[#111215]/20 dark:border-white/20 bg-white/60 dark:bg-black/30 text-xs sm:text-sm font-medium hover:bg-white dark:hover:bg-black/60 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Jelajahi Fitur</span>
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    </a>
                  </>
                )}
                {user && (
                  <Link
                    href="/leaderboard"
                    className="h-10 px-3.5 rounded-lg border border-dashed border-[#111215]/25 dark:border-white/20 text-xs sm:text-sm font-medium hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>Leaderboard Kampus</span>
                  </Link>
                )}
              </div>

              {/* Mini Highlights */}
              <div data-reveal="true" className="pt-2 flex flex-wrap gap-4 text-xs font-mono text-[#111215]/60 dark:text-white/50">
                <span>✓ Saldo Terisolasi</span>
                <span>✓ Reconcile &lt;3 Detik</span>
                <span>✓ 0 Biaya Transfer P2P</span>
              </div>
            </div>

            {/* Right Column: Hero Visual Component Art */}
            <div data-reveal="true" className="lg:col-span-5 flex justify-center">
              <HeroVisualArt />
            </div>
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
      <section id="fitur" data-choreo="true" className="relative border-b border-[#111215]/15 dark:border-white/10">
        <span aria-hidden="true" data-draw-rule="true" className="absolute inset-x-0 top-0 h-px bg-[#111215]/20 dark:bg-white/15" />
        <span aria-hidden="true" data-draw-tick="true" className="tick tick-half z-30 -top-[5px] -left-[6px]" />
        <span aria-hidden="true" data-draw-tick="true" className="tick tick-half z-30 -top-[5px] -right-[5px]" />
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
          <div data-reveal="true" className="px-6 py-10 md:px-10 md:py-14">
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

          {/* Compact 3-Column Grid with 1px border lines (Clean & Data Safe) */}
          <div data-reveal-group="true" className="grid gap-px border-t border-[#111215]/15 dark:border-white/10 bg-[#111215]/15 dark:bg-white/10 md:grid-cols-3">
            {/* Card 1: Kantong Sakune */}
            <article data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Sub-Wallet Mandiri</span>
                <span>01</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#111215] text-[#f4f3ef] dark:bg-white dark:text-[#111215] aspect-square flex flex-col justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-wider opacity-60">Utama</span>
                    <div className="font-bold text-xs">Simulasi</div>
                    <span className="text-[7px] font-mono px-1 py-0.5 rounded bg-white/20 dark:bg-black/10 w-fit">Aktif</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-500/10 aspect-square flex flex-col justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Pos A</span>
                    <div className="font-bold text-xs text-[#111215] dark:text-white">Pos A</div>
                    <span className="text-[7px] font-mono text-emerald-600 dark:text-emerald-400">Tersedia</span>
                  </div>
                  <div className="p-2.5 rounded-lg border border-blue-300/60 dark:border-blue-800/60 bg-blue-500/10 aspect-square flex flex-col justify-between">
                    <span className="text-[8px] font-mono uppercase tracking-wider text-blue-700 dark:text-blue-400">Pos B</span>
                    <div className="font-bold text-xs text-[#111215] dark:text-white">Pos B</div>
                    <span className="text-[7px] font-mono text-blue-600 dark:text-blue-400">Tersedia</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111215] dark:text-white">
                    Kantong Sakune
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Satu Kantong Utama permanen sebagai saldo saku & penerima QRIS, plus 2 kantong tambahan fleksibel untuk memilah pos tabungan secara mandiri.
                  </p>
                </div>
              </div>
            </article>

            {/* Card 2: Event Sakune Kas Bersama (Generic Mockup - No Leaks) */}
            <article data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Event Kas Kelas</span>
                <span>02</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="p-3.5 rounded-xl border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">Simulasi Kas Kegiatan Kelas</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">100% Tercatat</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "65%" }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono opacity-60">
                    <span>Target Terukur Per Mahasiswa</span>
                    <span>Sisa Waktu Otomatis</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111215] dark:text-white">
                    Event Sakune & Kas Terarah
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Buka tabungan bersama kelas dengan batas waktu countdown, alokasi instan dari dompet utama, dan rekapitulasi otomatis tanpa risiko selisih kas.
                  </p>
                </div>
              </div>
            </article>

            {/* Card 3: 4-Tier RBAC & Isolasi Wilayah */}
            <article data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#111215]/10 dark:border-white/10 px-5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-[#111215]/60 dark:text-white/50">
                <span>Otorisasi & Privasi</span>
                <span>03</span>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                  <div className="p-2 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100 text-[11px]">DEKAN</span>
                    <span className="text-[9px] opacity-60">Fakultas</span>
                  </div>
                  <div className="p-2 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100 text-[11px]">KAPRODI</span>
                    <span className="text-[9px] opacity-60">Prodi</span>
                  </div>
                  <div className="p-2 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100 text-[11px]">ADMIN KELAS</span>
                    <span className="text-[9px] opacity-60">1 Kelas</span>
                  </div>
                  <div className="p-2 rounded-lg border border-[#111215]/10 dark:border-white/10 bg-white/70 dark:bg-black/30">
                    <span className="font-bold block text-zinc-900 dark:text-zinc-100 text-[11px]">MAHASISWA</span>
                    <span className="text-[9px] opacity-60">Portal</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111215] dark:text-white">
                    Isolasi Wilayah 4-Tier RBAC
                  </h3>
                  <p className="mt-1 text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                    Setiap peran akademik hanya dapat mengakses data dalam lingkup kewenangannya. Data mahasiswa terlindungi dari intipan antar-prodi.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── 5. SECTION ARSITEKTUR & INTEGRITAS ─── */}
      <section data-choreo="true" className="relative border-b border-[#111215]/15 dark:border-white/10">
        <span aria-hidden="true" data-draw-rule="true" className="absolute inset-x-0 top-0 h-px bg-[#111215]/20 dark:bg-white/15" />
        <span aria-hidden="true" data-draw-tick="true" className="tick tick-half z-30 -top-[5px] -left-[6px]" />
        <span aria-hidden="true" data-draw-tick="true" className="tick tick-half z-30 -top-[5px] -right-[5px]" />
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

          <div data-reveal="true" className="px-6 py-10 md:px-10 md:py-14 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#111215] dark:text-white">
              Transparansi penuh,{" "}
              <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
                tanpa celah manipulasi.
              </span>
            </h2>
          </div>

          <div data-reveal-group="true" className="grid gap-px border-t border-[#111215]/15 dark:border-white/10 bg-[#111215]/15 dark:bg-white/10 md:grid-cols-3">
            <div data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">01 / ARSITEKTUR</span>
              <h3 className="font-bold text-sm text-[#111215] dark:text-white">Immutable Double Ledger</h3>
              <p className="text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                Pencatatan saldo hanya menggunakan transaksi append-only. Koreksi saldo dilakukan melalui jurnal pembalik otomatis.
              </p>
            </div>
            <div data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">02 / FORENSIK</span>
              <h3 className="font-bold text-sm text-[#111215] dark:text-white">Audit Log Per-Aksi</h3>
              <p className="text-xs text-[#111215]/70 dark:text-white/60 leading-relaxed">
                Setiap mutasi saldo manual, reset kata sandi, dan perubahan hak akses granular dicatat permanen dalam riwayat audit kampus.
              </p>
            </div>
            <div data-reveal="true" className="bg-[#f4f3ef] dark:bg-[#0e0f12] p-6 space-y-2">
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
      <section data-choreo="true" className="relative border-b border-[#111215]/15 dark:border-white/10 py-16 md:py-24">
        <span aria-hidden="true" data-draw-rule="true" className="absolute inset-x-0 top-0 h-px bg-[#111215]/20 dark:bg-white/15" />
        <div data-reveal-group="true" className="max-w-[1280px] mx-auto px-6 md:px-10 text-center">
          <div data-reveal="true" className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-[#111215]/20 dark:border-white/15 bg-white/70 dark:bg-black/40 text-[10px] font-mono uppercase tracking-widest text-[#111215]/80 dark:text-white/80 mb-4">
            <span>SISTEM INFORMASI TABUNGAN KAMPUS</span>
          </div>
          <h2 data-reveal="true" className="text-3xl sm:text-5xl font-bold tracking-tight text-[#111215] dark:text-white">
            Mulai bangun kebiasaan menabung{" "}
            <span className="font-serif italic font-normal text-[#111215]/60 dark:text-white/60">
              hari ini.
            </span>
          </h2>
          <p data-reveal="true" className="mt-4 text-xs sm:text-sm text-[#111215]/70 dark:text-white/60 max-w-md mx-auto">
            Bergabunglah dengan ratusan mahasiswa lainnya dalam ekosistem kas kelas yang transparan dan tertib administrasi.
          </p>
          <div data-reveal="true" className="mt-8 flex justify-center gap-3">
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
            <span className="font-bold text-[#111215] dark:text-white">SAKUNE SISFOR</span>
            <span className="opacity-30">|</span>
            <span>© 2026 PRODI SISTEM INFORMASI</span>
          </div>
          <div className="flex items-center gap-5">
            {user ? (
              <>
                <Link href="/topup" className="hover:underline">Top Up QRIS</Link>
                <Link href="/leaderboard" className="hover:underline">Leaderboard</Link>
                <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              </>
            ) : (
              <Link href="/login" className="hover:underline">Masuk Portal</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
