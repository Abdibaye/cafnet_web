"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function BusinessDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <span
        className="material-symbols-outlined text-[48px] text-secondary"
        aria-hidden="true"
      >
        error_outline
      </span>
      <h1 className="mt-4 text-2xl font-bold text-on-surface">
        Something went wrong in Business Center
      </h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        An unexpected error occurred while loading your dashboard. Please try again.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8]"
        >
          Try again
        </button>
        <Link
          href="/business/dashboard"
          className="text-sm font-semibold text-primary transition-colors hover:text-[#0f46b8]"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
