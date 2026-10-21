"use client";

import { useSearchParams } from "next/navigation";
import ErrorTemplate from "@/components/ErrorTemplate";
import { Suspense } from "react";

function DynamicErrorViewer() {
  const params = useSearchParams();
  const code = params.get("code") || "400";
  const msg = params.get("msg") || undefined;

  return <ErrorTemplate code={code} customMessage={msg} />;
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex items-center justify-center text-xs font-mono text-gray-400">Loading error view...</div>}>
      <DynamicErrorViewer />
    </Suspense>
  );
}
