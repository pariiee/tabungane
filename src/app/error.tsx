"use client";

import { useEffect } from "react";
import ErrorTemplate from "@/components/ErrorTemplate";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number; statusCode?: number };
  reset: () => void;
}) {
  const rawMsg = String(error?.message || "");

  useEffect(() => {
    // Auto-reload silently if it's a ChunkLoadError from a new deployment
    const isChunkError =
      rawMsg.includes("Loading chunk") ||
      rawMsg.includes("Failed to fetch dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkError && typeof window !== "undefined") {
      const lastReload = sessionStorage.getItem("chunk_reload_ts");
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem("chunk_reload_ts", String(now));
        window.location.reload();
        return;
      }
    }

    console.error("[APPLICATION RUNTIME ERROR]:", rawMsg);
  }, [error, rawMsg]);

  // Sanitize message: never leak paths, chunks, or internal details to users
  const isSensitive =
    rawMsg.includes("Loading chunk") ||
    rawMsg.includes("_next") ||
    rawMsg.includes(".js") ||
    rawMsg.includes("ENOENT") ||
    rawMsg.includes("Cannot find") ||
    rawMsg.includes("http://") ||
    rawMsg.includes("https://") ||
    rawMsg.includes("Invariant");

  const safeMessage = isSensitive
    ? "Sistem sedang diperbarui atau mengalami kendala pemuatan aset. Silakan segarkan halaman untuk memuat versi terbaru."
    : error?.message || undefined;

  const codeMatch =
    (error as any)?.status ||
    (error as any)?.statusCode ||
    rawMsg.match(/\b(4\d\d(?:\.\d+)?|5\d\d)\b/)?.[0] ||
    "500";

  return (
    <ErrorTemplate
      code={String(codeMatch)}
      customMessage={safeMessage}
      onReset={() => {
        if (typeof window !== "undefined") {
          window.location.reload();
        } else {
          reset();
        }
      }}
    />
  );
}
