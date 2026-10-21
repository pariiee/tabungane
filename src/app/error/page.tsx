"use client";

import { useSearchParams } from "next/navigation";
import ErrorTemplate from "@/components/ErrorTemplate";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "400";
  const msg = searchParams.get("msg") || undefined;

  return <ErrorTemplate code={code} customMessage={msg} />;
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-xs text-gray-400">Memuat status error...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
