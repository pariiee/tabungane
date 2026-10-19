import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import ClientShell from "@/components/ClientShell";

export const metadata: Metadata = {
  title: "SAKUNE SISFOR - Dompet Kampus & Tabungan Mahasiswa",
  description: "Web dompet digital kampus dan tabungan bersama per kelas dengan QRIS dan transparansi leaderboard progres.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full">
      <body className="min-h-full bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 antialiased flex flex-col font-sans">
        {/* Garis tipis gelap setinggi 3px di paling atas halaman */}
        <div className="h-[3px] bg-zinc-900 dark:bg-zinc-100 w-full fixed top-0 left-0 z-50 pointer-events-none" />

        <Suspense fallback={<div className="p-8 text-center text-xs text-gray-400">Memuat antarmuka...</div>}>
          <ClientShell>
            {children}
          </ClientShell>
        </Suspense>
      </body>
    </html>
  );
}
