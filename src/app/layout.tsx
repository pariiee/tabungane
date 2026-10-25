import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { ThemeProvider } from "@/components/ThemeProvider";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ef" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f12" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://sakune.sisforhub.web.id"),
  title: "SAKUNE SISFOR - Ekosistem Finansial & Kas Mahasiswa",
  description: "Web dompet digital kampus dan tabungan bersama per kelas dengan QRIS dan transparansi leaderboard progres.",
  alternates: {
    canonical: "https://sakune.sisforhub.web.id",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "SAKUNE SISFOR - Ekosistem Finansial & Kas Mahasiswa",
    description: "In This Economy? Yuk Nabung. Portal kas dan tabungan mahasiswa transparan.",
    url: "https://sakune.sisforhub.web.id",
    siteName: "SAKUNE SISFOR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SAKUNE — In This Economy? Yuk Nabung",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@sakunesisfor",
    creator: "@sakunesisfor",
    title: "SAKUNE SISFOR - Ekosistem Finansial & Kas Mahasiswa",
    description: "In This Economy? Yuk Nabung. Portal kas dan tabungan mahasiswa transparan.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SAKUNE SISFOR - Ekosistem Finansial & Kas Mahasiswa",
  description: "Web dompet digital kampus dan tabungan bersama per kelas dengan QRIS dan transparansi leaderboard progres.",
  url: "https://sakune.sisforhub.web.id",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var msg = (e && (e.message || (e.error && e.error.message))) || '';
                if (typeof msg === 'string' && (msg.indexOf('Loading chunk') !== -1 || msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('dynamically imported') !== -1)) {
                  var last = sessionStorage.getItem('chunk_reload');
                  var now = Date.now();
                  if (!last || now - parseInt(last, 10) > 10000) {
                    sessionStorage.setItem('chunk_reload', String(now));
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
