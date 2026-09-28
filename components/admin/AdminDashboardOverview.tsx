"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllBusinesses, type MockBusiness } from "@/data/mockBusinesses";
import { loadBusinessOwnerState, type BusinessClaim, type BusinessSubmission } from "@/data/businessOwnerStorage";
import { getAdminStats, type AdminStats } from "@/data/adminStorage";

export default function AdminDashboardOverview() {
  const [businesses, setBusinesses] = useState<MockBusiness[]>(() => getAllBusinesses());
  const [ownerState, setOwnerState] = useState(() => loadBusinessOwnerState());

  const reload = () => {
    setBusinesses(getAllBusinesses());
    setOwnerState(loadBusinessOwnerState());
  };

  useEffect(() => {
    reload();
    const handleEvents = () => reload();
    window.addEventListener("cafnet:admin-updated", handleEvents);
    window.addEventListener("cafnet:business-owner-updated", handleEvents);
    window.addEventListener("cafnet:managed-businesses-updated", handleEvents);

    return () => {
      window.removeEventListener("cafnet:admin-updated", handleEvents);
      window.removeEventListener("cafnet:business-owner-updated", handleEvents);
      window.removeEventListener("cafnet:managed-businesses-updated", handleEvents);
    };
  }, []);

  const stats: AdminStats = getAdminStats(businesses);
  const pendingClaims = ownerState.claims.filter((c) => c.status === "pending");
  const pendingSubmissions = ownerState.submissions.filter((s) => s.status === "pending");

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Platform overview</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review business onboarding, verify claims, and govern live listings across Cafnet.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Pending Claims */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Business Claims
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {stats.pendingClaimsCount}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">pending</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {stats.approvedClaimsCount} approved · {stats.rejectedClaimsCount} rejected
          </p>
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Link
              href="/admin/claims"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              Review claims
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              New Submissions
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">post_add</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {stats.pendingSubmissionsCount}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">pending</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {stats.approvedSubmissionsCount} approved · {stats.rejectedSubmissionsCount} rejected
          </p>
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Link
              href="/admin/submissions"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              Review submissions
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Live Businesses */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Published Places
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {stats.totalBusinessesCount}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">places listed</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {stats.verifiedBusinessesCount} verified businesses
          </p>
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Link
              href="/admin/businesses"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              View all businesses
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Queues */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Claims Queue */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Pending claims</h2>
              <p className="text-xs text-on-surface-variant">Awaiting ownership verification</p>
            </div>
            <Link
              href="/admin/claims"
              className="text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              View all ({pendingClaims.length})
            </Link>
          </div>

          <div className="mt-4">
            {pendingClaims.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  check_circle
                </span>
                <p className="mt-2">No pending claims to review.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {pendingClaims.slice(0, 4).map((claim) => {
                  const b = businesses.find((item) => item.id === claim.businessId);
                  return (
                    <div key={claim.id} className="flex items-center justify-between py-3.5">
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="truncate text-sm font-semibold text-on-surface">
                          {b?.name || `Business #${claim.businessId}`}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          Submitted {new Date(claim.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <Link
                        href={`/admin/claims/${claim.id}`}
                        className="inline-flex h-8 items-center rounded-lg bg-primary-container px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                      >
                        Review
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Pending Submissions Queue */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-lg font-bold text-on-surface">Pending submissions</h2>
              <p className="text-xs text-on-surface-variant">New business listings to approve</p>
            </div>
            <Link
              href="/admin/submissions"
              className="text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              View all ({pendingSubmissions.length})
            </Link>
          </div>

          <div className="mt-4">
            {pendingSubmissions.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  check_circle
                </span>
                <p className="mt-2">No pending business submissions.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {pendingSubmissions.slice(0, 4).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-3.5">
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {sub.businessName}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {sub.category} · {sub.area}
                      </p>
                    </div>
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="inline-flex h-8 items-center rounded-lg bg-primary-container px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
