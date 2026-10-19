"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin view error caught by boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <span className="material-symbols-outlined text-[48px] text-secondary" aria-hidden="true">
        error_outline
      </span>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">Admin operation error</h1>
      <p className="mt-2 text-sm text-on-surface-variant">
        An error occurred while loading this administrative view. Please try again.
      </p>
      {error?.message && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left text-xs font-mono text-red-700">
          <p className="font-bold">Error:</p>
          <p className="mt-0.5 break-words">{error.message}</p>
        </div>
      )}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8]"
        >
          Try again
        </button>
        <Link
          href="/admin"
          className="text-sm font-semibold text-primary transition-colors hover:text-[#0f46b8]"
        >
          Return to Admin Overview
        </Link>
      </div>
    </div>
  );
}
