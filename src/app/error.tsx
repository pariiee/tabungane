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
  useEffect(() => {
    console.error("[APPLICATION RUNTIME ERROR]:", error);
  }, [error]);

  // Deteksi kode status (400, 401, 403, 419, 429, 502, 503, dll) jika ada di error
  const codeMatch =
    (error as any)?.status ||
    (error as any)?.statusCode ||
    error?.message?.match(/\b(4\d\d(?:\.\d+)?|5\d\d)\b/)?.[0] ||
    "500";

  return (
    <ErrorTemplate
      code={String(codeMatch)}
      customMessage={error?.message || undefined}
      onReset={reset}
    />
  );
}
