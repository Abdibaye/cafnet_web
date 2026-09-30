"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listClaims } from "@/lib/api/admin";
import { listBusinesses } from "@/lib/api/businesses";
import type { BusinessClaim, Business } from "@/lib/api/types";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [businesses, setBusinesses] = useState<Record<number, Business>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [claimsData, bizResult] = await Promise.all([
        listClaims({
          status: statusFilter === "all" ? "ALL" : statusFilter.toUpperCase(),
        }),
        listBusinesses({ limit: 100 }),
      ]);

      setClaims(claimsData || []);
      const bMap: Record<number, Business> = {};
      for (const b of bizResult?.businesses || []) {
        bMap[b.id] = b;
      }
      setBusinesses(bMap);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = claims.filter((c) => c.status === "PENDING").length;

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
          {
            key: "approved",
            label: "Approved",
            count: claims.filter((c) => c.status === "APPROVED").length,
          },
          {
            key: "rejected",
            label: "Rejected",
            count: claims.filter((c) => c.status === "REJECTED").length,
          },
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
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-5"
            />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">assignment_ind</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No claims found</h2>
          <p className="mt-1 text-xs">There are no business claims in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const business = businesses[claim.business_id];
            const isApproved = claim.status === "APPROVED";
            const isRejected = claim.status === "REJECTED";
            const isPending = claim.status === "PENDING";

            return (
              <div
                key={claim.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-on-surface text-base">
                      {business ? business.name : `Business #${claim.business_id}`}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
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
                      {isApproved ? "Approved" : isRejected ? "Rejected" : "Pending Review"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {business ? (
                      <>
                        {business.category} · {business.cuisine} · {business.location_name || business.neighborhood}
                      </>
                    ) : (
                      `ID #${claim.business_id}`
                    )}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant">
                    <span>
                      Claimed{" "}
                      {new Date(claim.submitted_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>Claimant: {claim.claimant_user_id}</span>
                  </div>
                </div>

                <div className="shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/admin/claims/${claim.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary-container px-4 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Inspect claim
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
