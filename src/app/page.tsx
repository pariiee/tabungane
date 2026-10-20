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
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-gray-100 dark:border-zinc-800/80">
        {/* Subtle background glow grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-zinc-800 text-[11px] font-semibold text-gray-800 dark:text-zinc-200 border border-gray-200/80 dark:border-zinc-700/80 mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PLATFORM KEUANGAN & SAKU MAHASISWA KAMPUS</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-black dark:text-white">
              Kelola Kas & Tabungan Kampus Lebih{" "}
              <span className="underline decoration-1 underline-offset-8 decoration-gray-400 dark:decoration-zinc-600">
                Transparan
              </span>
              .
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-base sm:text-lg text-gray-600 dark:text-zinc-400 leading-relaxed font-normal">
              Satu portal terintegrasi untuk top up QRIS otomatis, event tabungan kas kelas, leaderboard podium 3D, hingga hierarki delegasi berjenjang Fakultas, Prodi, dan Adminya Kelas.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {user ? (
                <Link
                  href={isAdmin ? "/admin" : "/dashboard"}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all shadow-md group"
                >
                  <span>{isAdmin ? "Buka Panel Admin" : "Buka Dashboard Mahasiswa"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all shadow-md group"
                  >
                    <span>Masuk ke Portal</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-800 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-850 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Lihat Leaderboard Kampus</span>
                  </Link>
                </>
              )}
            </div>

            {/* Trust highlights */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                <span>QRIS Instant Settlement</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                <span>Append-Only Double Ledger</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-black dark:text-white" />
                <span>Zero Bocor Antar Prodi</span>
              </div>
            </div>
          </div>

          {/* Interactive Virtual Card Showcase with Live Simulator */}
          <div className="mt-14 max-w-xl mx-auto">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* 2. STATS STRIP */}
      <section className="border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/30 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-black dark:text-white">
                &lt; 1 Detik
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                Verifikasi QRIS Otomatis
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-black dark:text-white">
                100%
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                Transparansi Kas Kelas
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-black dark:text-white">
                Top 10
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                Podium 3D Leaderboard
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-black dark:text-white">
                4 Tingkat
              </div>
              <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-medium">
                Hierarki Pengawasan Kampus
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID FEATURES */}
      <section className="py-16 md:py-24 border-b border-gray-100 dark:border-zinc-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              FITUR UTAMA
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mt-1">
              Dirancang Khusus untuk Kebutuhan Kampus Modern
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1: QRIS Instant & Dompet Saku */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4">
                  <QrCode className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Top Up QRIS Instan
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Isi saldo dompet saku mahasiswa kapan saja menggunakan seluruh e-wallet & m-banking Indonesia dengan webhook rekonsiliasi otomatis.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Auto-Reconcile qriskuu.com</span>
              </div>
            </div>

            {/* Bento 2: Event Sakune & Iuran Kas */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Event Sakune & Tabungan Kas
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Pengurus kelas bisa membuka target event seperti Study Tour, Uang Kas Semester, atau Kunjungan Industri dengan deadline hitung mundur.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Target & Deadline Realtime</span>
              </div>
            </div>

            {/* Bento 3: Leaderboard Podium 3D */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Podium 3D & Privasi Saldo
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Peringkat Top 10 penabung teratas dengan podium 3D monokrom elegan. Mahasiswa bebas menyensor saldonya demi kenyamanan privasi.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Strict Toggle Privasi Saldo</span>
              </div>
            </div>

            {/* Bento 4: Hierarki Bertingkat (Span 2 cols on md) */}
            <div className="md:col-span-2 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4">
                  <Landmark className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Hierarki Multi-Kampus: Fakultas &rarr; Prodi &rarr; Kelas
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Super Admin memegang kendali global seluruh kampus. Dekan mengawasi fakultas, Kaprodi mengawasi program studi, dan Komting/Bendahara bertindak sebagai <strong>ADMINYA KELAS</strong> untuk kelasnya sendiri.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono text-center">
                <div className="p-2 rounded bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/50 dark:border-zinc-700/50">
                  <span className="font-bold block">FAKULTAS</span>
                  <span className="text-gray-400 text-[10px]">Dekan Scope</span>
                </div>
                <div className="p-2 rounded bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/50 dark:border-zinc-700/50">
                  <span className="font-bold block">PRODI</span>
                  <span className="text-gray-400 text-[10px]">Kaprodi Scope</span>
                </div>
                <div className="p-2 rounded bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/50 dark:border-zinc-700/50">
                  <span className="font-bold block">KELAS</span>
                  <span className="text-gray-400 text-[10px]">Adminya Kelas</span>
                </div>
                <div className="p-2 rounded bg-gray-50 dark:bg-zinc-800/80 border border-gray-200/50 dark:border-zinc-700/50">
                  <span className="font-bold block">MAHASISWA</span>
                  <span className="text-gray-400 text-[10px]">Portal Pribadi</span>
                </div>
              </div>
            </div>

            {/* Bento 5: Ledger Keuangan Aman */}
            <div className="p-6 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white">
                  Audit Log & Ledger Abadi
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2 leading-relaxed">
                  Tidak ada saldo yang bisa dimanipulasi manual. Setiap koreksi dilakukan melalui reversal transaksi pembalik dengan catatan audit ketat.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/60 flex items-center gap-2 text-xs font-mono text-gray-600 dark:text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Immutable Financial Records</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CARA KERJA (3 STEPS) */}
      <section className="py-16 md:py-20 border-b border-gray-100 dark:border-zinc-800/80 bg-gray-50/50 dark:bg-zinc-900/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              ALUR PENGGUNAAN
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-black dark:text-white mt-1">
              Hanya Butuh 3 Langkah Sederhana
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold font-mono flex items-center justify-center mb-4 text-sm">
                1
              </div>
              <h4 className="text-sm font-bold text-black dark:text-white">
                Masuk Menggunakan Akun Kampus
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                Mahasiswa login menggunakan NIM resmi mereka, sementara pengurus masuk dengan peran aksesnya.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold font-mono flex items-center justify-center mb-4 text-sm">
                2
              </div>
              <h4 className="text-sm font-bold text-black dark:text-white">
                Top Up QRIS atau Titip Kas
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                Isi dompet saku langsung via scan QRIS atau bayar tunai ke ADMINYA KELAS untuk dicatat di sistem.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold font-mono flex items-center justify-center mb-4 text-sm">
                3
              </div>
              <h4 className="text-sm font-bold text-black dark:text-white">
                Alokasi Event & Pantau Kas
              </h4>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-2">
                Gunakan saldo untuk melunasi iuran event kelas dan pantau leaderboard tabungan se-kampus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FAQ ACCORDION */}
      <section className="py-16 md:py-24 border-b border-gray-100 dark:border-zinc-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black dark:text-white mt-1">
              Pertanyaan yang Sering Diajukan
            </h2>
          </div>

          <div className="space-y-3.5">
            <details className="group border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-semibold text-sm text-black dark:text-white select-none">
                <span>Apakah saldo kas kelas bisa bocor atau dilihat oleh mahasiswa jurusan/prodi lain?</span>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/60 pt-3">
                Sama sekali tidak. Sistem kami menerapkan <strong>strict data isolation</strong>. Kaprodi, Dekan, maupun ADMINYA KELAS hanya dapat melihat data mahasiswa dan kelas yang berada di bawah wewenangnya. Di leaderboard kampus pun, mahasiswa berhak menyensor nominal saldonya menjadi simbol titik-titik (•••••••).
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-semibold text-sm text-black dark:text-white select-none">
                <span>Bagaimana jika mahasiswa tidak memiliki m-banking atau e-wallet untuk scan QRIS?</span>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/60 pt-3">
                Mahasiswa tetap bisa menitipkan uang kas secara tunai (cash) kepada <strong>ADMINYA KELAS</strong> (Komting atau Bendahara Kelas). Pengurus kelas memiliki akses untuk mencatat setoran manual di sistem agar masuk ke pencatatan ledger resmi kelas secara realtime.
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-semibold text-sm text-black dark:text-white select-none">
                <span>Bagaimana jika bendahara salah menginput nominal setoran tunai?</span>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/60 pt-3">
                Sistem kami menggunakan <strong>Double-Entry Append-Only Ledger</strong>. Data transaksi tidak pernah dihapus atau diubah angka aslinya, melainkan dibuatkan transaksi koreksi pembalik (<em>reversal transaction</em>) lengkap dengan alasan pembatalan dan audit trail yang jelas demi transparansi.
              </p>
            </details>

            <details className="group border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900/50 [&_summary::-webkit-details-marker]:hidden cursor-pointer transition-all">
              <summary className="flex items-center justify-between font-semibold text-sm text-black dark:text-white select-none">
                <span>Siapa saja yang berhak membuka Event Sakune tabungan baru?</span>
                <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180 shrink-0 ml-2" />
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-zinc-400 border-t border-gray-100 dark:border-zinc-800/60 pt-3">
                Super Admin dapat membuka event skala kampus, Kaprodi dapat membuka event jurusan, dan ADMINYA KELAS dapat membuka event khusus untuk kelas yang mereka bina (seperti Kas Semester, Buka Puasa Bersama, atau Kunjungan Industri).
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="py-12 bg-white dark:bg-zinc-950 text-xs text-gray-500 dark:text-zinc-400">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-xs bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-black dark:text-white tracking-tight">
              SAKUNE SISFOR
            </span>
            <span className="text-gray-400">&bull;</span>
            <span>Platform Keuangan Kas Kampus</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-black dark:hover:text-white transition-colors">
              Portal Login
            </Link>
            <Link href="/leaderboard" className="hover:text-black dark:hover:text-white transition-colors">
              Leaderboard
            </Link>
            <span className="text-gray-400 dark:text-zinc-600">&copy; 2026 Tabungane Sisfor</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
