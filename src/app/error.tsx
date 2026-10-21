"use client";

import { useEffect } from "react";
import ErrorTemplate from "@/components/ErrorTemplate";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APPLICATION RUNTIME ERROR]:", error);
  }, [error]);

  return (
    <ErrorTemplate
      code="500"
      customMessage={error?.message || "Terjadi kendala pada eksekusi runtime server aplikasi."}
      onReset={reset}
    />
  );
}
