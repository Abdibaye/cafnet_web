"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { searchBusinesses as apiSearchBusinesses } from "@/lib/api/search";
import type { Business } from "@/lib/api/types";

function categoryLabel(category?: string) {
  return category === "cafe" ? "Café" : category === "drinks" ? "Drinks & More" : "Restaurant";
}

export default function BusinessClaimFlow() {
  const { authReady, isAuthenticated, startSignIn, startSignUp } = useCustomer();
  const { ready, getClaim, submitClaim } = useBusinessOwner();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Business | null>(null);
  const [results, setResults] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await apiSearchBusinesses({ q: trimmed });
        if (!cancelled) {
          setResults(res.results.map((r) => r.business));
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  const existingClaim = selected ? getClaim(selected.id) : undefined;

  const handleClaim = async () => {
    if (!selected) return;
    if (!isAuthenticated) {
      startSignIn();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitClaim(selected.id);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authReady || !ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
        Loading business search...
      </div>
    );
  }

  if (submitted && selected) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          For businesses
        </p>
        <h1 className="mt-3 text-3xl font-bold text-on-surface">Claim request submitted</h1>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          We&apos;ve received your request for:
        </p>
        <h2 className="mt-3 text-xl font-bold text-on-surface">{selected.name}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{selected.location_name || selected.neighborhood}</p>
        <div className="mt-8 border border-outline-variant bg-white p-5">
          <p className="font-semibold text-on-surface">Pending verification</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Platform administrators will verify that you represent this business before granting access.
          </p>
        </div>
        <Link
          href="/business/dashboard"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          View Business Center
        </Link>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:text-[#0f46b8]"
          onClick={() => setSelected(null)}
        >
          ← Choose another business
        </button>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          For businesses
        </p>
        <h1 className="mt-3 text-3xl font-bold text-on-surface">Claim this business</h1>
        <div className="mt-8 border border-outline-variant bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
            You selected
          </p>
          <h2 className="mt-3 text-xl font-bold text-on-surface">{selected.name}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {categoryLabel(selected.category)} · {selected.location_name || selected.neighborhood}
          </p>
        </div>

        {selected.claim_status === "CLAIMED" ? (
          <div className="mt-6 border border-outline-variant bg-surface-container-low p-5">
            <p className="font-semibold text-on-surface">This business is already managed on Cafnet.</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              If you represent this business and need access, please contact Cafnet support.
            </p>
          </div>
        ) : existingClaim ? (
          <div className="mt-6 border border-outline-variant bg-surface-container-low p-5">
            <p className="font-semibold text-on-surface">Claim already submitted</p>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Your claim for this business is currently awaiting administrative verification.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm leading-6 text-on-surface-variant">
              Claiming this listing lets you manage your business information on Cafnet. You may be asked to verify that you represent this business.
            </p>
            {!isAuthenticated && (
              <div className="mt-4 rounded-xl border border-outline-variant bg-amber-50/70 p-4 text-sm text-amber-900">
                <p className="font-semibold">Sign in required</p>
                <p className="mt-1 text-xs">You will be prompted to sign in or create an account to submit your claim.</p>
              </div>
            )}
            {submitError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600" role="alert">
                {submitError}
              </div>
            )}
            <button
              type="button"
              disabled={submitting}
              className="mt-7 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#0f46b8]"
              onClick={handleClaim}
            >
              {submitting ? "Submitting..." : "Continue"}
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 lg:py-20">
      <Link href="/business" className="text-sm font-semibold text-primary">
        ← For businesses
      </Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Find an existing listing
      </p>
      <h1 className="mt-3 text-3xl font-bold text-on-surface">Find your business</h1>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
        Search Cafnet to see if your business is already listed.
      </p>

      <label htmlFor="business-search" className="mt-8 block text-sm font-semibold text-on-surface">
        Business name
      </label>
      <div className="mt-2 flex h-12 items-center gap-2 border border-outline-variant bg-white px-4 focus-within:border-primary">
        <span className="material-symbols-outlined text-[20px] text-outline" aria-hidden="true">
          search
        </span>
        <input
          id="business-search"
          className="w-full border-0 bg-transparent text-sm outline-none"
          placeholder="Try your business name or neighborhood"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {isSearching && (
          <span className="text-xs text-on-surface-variant animate-pulse">Searching...</span>
        )}
      </div>

      {query.trim() && (
        <div className="mt-5 space-y-3">
          {results.slice(0, showAll ? 20 : 5).map((business) => (
            <article
              key={business.id}
              className="flex items-center gap-4 border border-outline-variant bg-white p-4"
            >
              <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-secondary">
                <span className="material-symbols-outlined text-2xl">storefront</span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-on-surface">{business.name}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {categoryLabel(business.category)} · {business.location_name || business.neighborhood}
                </p>
                {business.claim_status === "CLAIMED" && (
                  <p className="mt-1 text-xs font-semibold text-on-surface-variant">Managed on Cafnet</p>
                )}
              </div>
              <button
                type="button"
                className="shrink-0 text-sm font-semibold text-primary hover:text-[#0f46b8]"
                onClick={() => setSelected(business)}
              >
                This is my business
              </button>
            </article>
          ))}
          {results.length > 5 && !showAll && (
            <button
              type="button"
              className="text-sm font-semibold text-primary"
              onClick={() => setShowAll(true)}
            >
              Show more results
            </button>
          )}
          {results.length === 0 && !isSearching && (
            <div className="border border-dashed border-outline-variant bg-white px-5 py-8">
              <h2 className="font-semibold text-on-surface">Can&apos;t find your business?</h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Your business may not be listed on Cafnet yet.
              </p>
              <div className="mt-5 flex flex-wrap gap-4">
                <Link href="/business/add" className="text-sm font-semibold text-primary">
                  Add your business <span className="ml-1" aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="text-sm font-semibold text-on-surface-variant hover:text-primary"
                  onClick={() => setQuery("")}
                >
                  Search again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
