"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadBusinessOwnerState, type BusinessClaim } from "@/data/businessOwnerStorage";
import { getBusinessById } from "@/data/mockBusinesses";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<BusinessClaim[]>(() => loadBusinessOwnerState().claims);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reload = () => {
    setClaims(loadBusinessOwnerState().claims);
  };

  useEffect(() => {
    reload();
    const handleEvents = () => reload();
    window.addEventListener("cafnet:admin-updated", handleEvents);
    window.addEventListener("cafnet:business-owner-updated", handleEvents);

    return () => {
      window.removeEventListener("cafnet:admin-updated", handleEvents);
      window.removeEventListener("cafnet:business-owner-updated", handleEvents);
    };
  }, []);

  const filtered = claims.filter((claim) => {
    if (statusFilter === "all") return true;
    return claim.status === statusFilter;
  });

  const pendingCount = claims.filter((c) => c.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Business claims</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Verify and grant business management access to authentic restaurant owners.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: "all", label: "All Claims", count: claims.length },
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "approved", label: "Approved", count: claims.filter((c) => c.status === "approved").length },
          { key: "rejected", label: "Rejected", count: claims.filter((c) => c.status === "rejected").length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
              statusFilter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key
                  ? "bg-primary-container text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Claims List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">assignment_ind</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No claims found</h2>
          <p className="mt-1 text-xs">There are no business claims in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((claim) => {
            const business = getBusinessById(claim.businessId);
            const isApproved = claim.status === "approved";
            const isRejected = claim.status === "rejected";
            const isPending = claim.status === "pending";

            return (
              <div
                key={claim.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-on-surface">
                      {business?.name || `Business #${claim.businessId}`}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isApproved
                          ? "bg-green-100 text-green-800"
                          : isRejected
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isApproved ? "check_circle" : isRejected ? "cancel" : "schedule"}
                      </span>
                      {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending review"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {business ? `${business.category} · ${business.location}` : "Listing detail"} ·
                    Submitted{" "}
                    {new Date(claim.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  {isRejected && claim.rejectionReason && (
                    <p className="mt-2 text-xs italic text-red-700">
                      Reason: &ldquo;{claim.rejectionReason}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/claims/${claim.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
                  >
                    {isPending ? "Review claim" : "View claim details"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
