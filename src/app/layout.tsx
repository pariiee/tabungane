import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "SAKUNE SISFOR - Ekosistem Finansial & Kas Mahasiswa",
  description: "Web dompet digital kampus dan tabungan bersama per kelas dengan QRIS dan transparansi leaderboard progres.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <body className="min-h-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased flex flex-col font-sans">
        {/* Garis tipis gelap setinggi 3px di paling atas halaman */}
        <div className="h-[3px] bg-zinc-900 dark:bg-zinc-100 w-full fixed top-0 left-0 z-50 pointer-events-none" />

        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <Suspense
            fallback={
              <div className="max-w-7xl mx-auto p-6 space-y-6 animate-pulse">
                <div className="h-9 w-44 bg-gray-200 dark:bg-zinc-800 rounded-lg" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="h-32 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800" />
                  <div className="h-32 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800" />
                  <div className="h-32 bg-gray-100 dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800" />
                </div>
              </div>
            }
          >
            <ClientShell>{children}</ClientShell>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
