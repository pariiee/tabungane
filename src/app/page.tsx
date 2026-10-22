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
} from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  const isSuperAdmin = user?.role === "super_admin";
  const isAdminKelas = user?.role === "admin_kelas";
  const isAdmin = isSuperAdmin || user?.role === "admin" || isAdminKelas;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950 font-sans">
      {/* ─── TOP HUD TICKER BAR ─── */}
      <div className="border-b border-gray-200 dark:border-zinc-800/80 bg-gray-50/80 dark:bg-[#0d0d10] text-[11px] font-mono tracking-tight text-gray-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM ACTIVE
            </span>
            <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">|</span>
            <span className="hidden sm:inline">TABUNGANE SISFOR v2.4</span>
            <span className="hidden md:inline text-gray-300 dark:text-zinc-700">|</span>
            <span className="hidden md:inline">IMMUTABLE LEDGER & QRIS AUTOMATION</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] sm:text-[11px]">
            <span>FAKULTAS ILMU KOMPUTER</span>
            <span className="text-gray-300 dark:text-zinc-700">/</span>
            <span>PROGRAM STUDI SISTEM INFORMASI</span>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: HERO DISPLAY (ARTCRAFT STYLE) ─── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-28 border-b border-gray-200 dark:border-zinc-800/80">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl">
            {/* HUD Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 text-[11px] font-mono uppercase tracking-wider text-gray-600 dark:text-zinc-300 mb-6 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white" />
              <span>Ekosistem Finansial Kampus Terpadu</span>
            </div>

            {/* Display Headline with Serif Italic Accent */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.08] text-zinc-950 dark:text-white">
              Kelola kas & tabungan{" "}
              <span className="font-serif italic font-normal text-zinc-500 dark:text-zinc-400">
                secara transparan.
              </span>
            </h1>

            {/* Sub-description */}
            <p className="mt-6 text-base sm:text-xl text-gray-600 dark:text-zinc-400 leading-relaxed max-w-2xl font-normal">
              Platform modern mahasiswa untuk membagi alokasi tabungan dengan{" "}
              <strong className="text-zinc-900 dark:text-zinc-200 font-medium">Kantong Sakune</strong> ala Bank Jago,
              mengelola kas event kelas tanpa selisih, serta automasi setor QRIS real-time yang aman.
            </p>

            {/* Primary Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="h-11 px-6 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium text-xs sm:text-sm hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>{isAdmin ? "Buka Panel Admin" : "Buka Dashboard Saya"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="h-11 px-6 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium text-xs sm:text-sm hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a
                    href="#fitur"
                    className="h-11 px-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs sm:text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Pelajari Fitur</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                </>
              )}
              <Link
                href="/leaderboard"
                className="h-11 px-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-xs sm:text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>Peringkat Kampus</span>
              </Link>
            </div>
          </div>

          {/* ─── LIVE TELEMETRY PREVIEW FRAME ─── */}
          <div className="mt-14 pt-8 border-t border-gray-200 dark:border-zinc-800/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/40">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Total Tabungan Terkumpul
                </span>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  Rp 148.500.000+
                </p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  <span>100% Tercatat Otomatis</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/40">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Kantong Sakune Aktif
                </span>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  Maks. 3 Kantong
                </p>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                  <Wallet className="w-3 h-3 text-zinc-500" />
                  <span>Sub-wallet Terpisah</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/40">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Kecepatan Konfirmasi QRIS
                </span>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  &lt; 3 Detik
                </p>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                  <QrCode className="w-3 h-3 text-zinc-500" />
                  <span>Webhook Idempoten</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/40">
                <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Hierarki Hak Akses
                </span>
                <p className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-1">
                  4-Tier RBAC
                </p>
                <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 mt-2 font-medium">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span>Dekan · Kaprodi · Admin Kelas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: THE BENTO GRID (KENDALI PENUH TANPA REKAYASA) ─── */}
      <section id="fitur" className="py-20 md:py-28 border-b border-gray-200 dark:border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                FITUR UTAMA SISTEM
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
                Kendali presisi yang{" "}
                <span className="font-serif italic font-normal text-zinc-500 dark:text-zinc-400">
                  tidak bisa ditawar.
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 max-w-md">
              Dirancang khusus untuk memecahkan kerumitan pembukuan kas kelas, transparansi iuran kegiatan, dan pengelolaan uang saku mahasiswa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Kantong Sakune */}
            <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                    MAKS. 3 KANTONG
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  Kantong Sakune (Bank Jago Style)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2 max-w-xl">
                  Bagi pos keuangan harianmu dengan mudah. Satu <strong>Kantong Utama</strong> permanen sebagai penampung saldo dan top up QRIS, ditambah hingga 2 kantong kustom dengan 6 pilihan warna palet.
                </p>
              </div>

              {/* Visual Mock of Kantong Cards */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 aspect-square flex flex-col justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-wider opacity-70">Kantong Utama</div>
                  <div>
                    <div className="text-lg font-bold">Rp 350.000</div>
                    <div className="text-[10px] opacity-75 mt-0.5">Saldo Siap Pakai</div>
                  </div>
                  <div className="flex gap-1 text-[9px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/10">TOP UP</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/20 dark:bg-black/10">TARIK</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-emerald-50/50 dark:bg-emerald-950/20 aspect-square flex flex-col justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Dana Skripsi</div>
                  <div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Rp 500.000</div>
                    <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Pos Penelitian</div>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">Pindah Saldo Instan</span>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/20 aspect-square flex flex-col justify-between">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-blue-700 dark:text-blue-400">Kas Study Tour</div>
                  <div>
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Rp 250.000</div>
                    <div className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">Target Rp 500k</div>
                  </div>
                  <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400">50% Terkumpul</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: Penarikan Saldo Dompet */}
            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Tarik Saldo ke Rekening / E-Wallet
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2">
                  Saldo saku di Dompet Utama dapat dicairkan langsung ke rekening BCA, Mandiri, BRI, DANA, GoPay, atau OVO mulai dari Rp 10.000 dengan alur verifikasi resmi.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-500">
                  <span>Minimum Penarikan</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">Rp 10.000</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Alur Verifikasi</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">Persetujuan Bendahara</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Sisa Saldo Terkunci</span>
                  <span className="font-mono text-zinc-400">Otomatis Hold</span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Kas & Event Sakune Kelas */}
            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Event Sakune & Kas Bersama
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2">
                  Kumpulkan dana kegiatan study tour, kas bulanan kelas, atau jaket angkatan secara terbuka dengan target nominal dan countdown deadline otomatis.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500">
                <span>Transparansi Kas</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">100% Real-time</span>
              </div>
            </div>

            {/* Bento Card 4: Transfer Antar Mahasiswa P2P */}
            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Transfer Instan P2P Mahasiswa
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2">
                  Kirim uang saku ke teman sekelas cukup dengan ketik ID Pengguna atau nama mahasiswa. Dilengkapi live auto-complete rekomendasi siswa dan minimal transfer Rp 1.000.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500">
                <span>Biaya Transaksi P2P</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Gratis (Rp 0)</span>
              </div>
            </div>

            {/* Bento Card 5: Delegasi 4-Tier & Scoping Prodi */}
            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  Isolasi Wilayah & Multi-Tier RBAC
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 mt-2">
                  Kaprodi hanya mengawasi Prodinya, Dekan menaungi seluruh Jurusan, dan Adminya Kelas mengurus kelasnya sendiri. Data terlindungi dari akses silang.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500">
                <span>Model Otorisasi</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">Strict Scoping</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: INTEGRITY & ARCHITECTURAL VALUES ─── */}
      <section className="py-20 md:py-28 border-b border-gray-200 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-[#0d0d10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-14">
            <div className="text-[11px] font-mono uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
              KEAMANAN & ARSITEKTUR
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-950 dark:text-white">
              Transparansi penuh,{" "}
              <span className="font-serif italic font-normal text-zinc-500 dark:text-zinc-400">
                tanpa celah manipulasi.
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-4 leading-relaxed">
              Kami membangun Tabungane Sisfor di atas prinsip integritas buku besar akuntansi (ledger-first), memastikan setiap rupiah yang masuk memiliki jejak digital yang tidak dapat disunting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-xs text-gray-400 dark:text-zinc-500 mb-2">01 / ARSITEKTUR</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Immutable Ledger Buku Besar</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Pencatatan saldo hanya menggunakan transaksi append-only. Tidak ada query update saldo siluman — koreksi hanya dapat dilakukan melalui jurnal pembalik otomatis.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-xs text-gray-400 dark:text-zinc-500 mb-2">02 / PRIVASI</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Kanonikal ID & Masking PII</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Seluruh identitas dinormalisasi menjadi ID Pengguna seragam. Password hash tidak pernah dibocorkan ke jaringan, dan mahasiswa bebas menyembunyikan saldo dari leaderboard publik.
              </p>
            </div>

            <div className="p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60">
              <div className="font-mono text-xs text-gray-400 dark:text-zinc-500 mb-2">03 / AUDIT</div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Audit Trail Forensik</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 mt-2 leading-relaxed">
                Setiap mutasi saldo manual, reset kata sandi, perubahan kelas, hingga pemberian izin khusus dicatat detail di histori log audit yang siap diekspor ke format CSV / rekap resmi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: CALL TO ACTION (START CRAFTING STYLE) ─── */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-xs font-mono text-gray-600 dark:text-zinc-400 mb-6">
            <span>SISTEM INFORMASI KEUANGAN MAHASISWA</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-zinc-950 dark:text-white leading-tight">
            Mulai bangun kebiasaan menabung{" "}
            <span className="font-serif italic font-normal text-zinc-500 dark:text-zinc-400">
              hari ini.
            </span>
          </h2>

          <p className="mt-6 text-sm sm:text-base text-gray-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ratusan mahasiswa lainnya yang telah mengelola kas kelas dan keuangan pribadi secara cerdas dan transparan di Tabungane Sisfor.
          </p>

          <div className="mt-10 flex flex-wrap justify-center items-center gap-3">
            <Link
              href={user ? (isAdmin ? "/admin" : "/dashboard") : "/login"}
              className="h-12 px-8 rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium text-sm hover:opacity-90 transition-all inline-flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <span>{user ? "Masuk ke Dashboard" : "Masuk dengan ID Pengguna"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="h-12 px-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Lihat Leaderboard Kampus</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ARCHITECTURAL FOOTER ─── */}
      <footer className="border-t border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-[#0a0a0c] text-xs py-10 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 dark:text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-bold text-[10px]">
              T
            </div>
            <span className="font-sans font-bold text-zinc-900 dark:text-zinc-100">TABUNGANE SISFOR</span>
            <span className="text-gray-300 dark:text-zinc-700">|</span>
            <span>© 2026 PROGRAM STUDI SISTEM INFORMASI</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <Link href="/topup" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Top Up QRIS
            </Link>
            <Link href="/leaderboard" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Leaderboard
            </Link>
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              Masuk Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
