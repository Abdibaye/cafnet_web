"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllBusinesses, type MockBusiness } from "@/data/mockBusinesses";
import { loadBusinessOwnerState } from "@/data/businessOwnerStorage";
import { getAdminStats, type AdminStats } from "@/data/adminStorage";
import { loadReviewReports, type ReviewReport } from "@/data/reviewReportStorage";

export default function AdminDashboardOverview() {
  const [businesses, setBusinesses] = useState<MockBusiness[]>(() => getAllBusinesses());
  const [ownerState, setOwnerState] = useState(() => loadBusinessOwnerState());
  const [reports, setReports] = useState<ReviewReport[]>(() => loadReviewReports());

  const reload = () => {
    setBusinesses(getAllBusinesses());
    setOwnerState(loadBusinessOwnerState());
    setReports(loadReviewReports());
  };

  useEffect(() => {
    reload();
    const handleEvents = () => reload();
    window.addEventListener("cafnet:admin-updated", handleEvents);
    window.addEventListener("cafnet:business-owner-updated", handleEvents);
    window.addEventListener("cafnet:managed-businesses-updated", handleEvents);
    window.addEventListener("cafnet:review-moderation-updated", handleEvents);

    return () => {
      window.removeEventListener("cafnet:admin-updated", handleEvents);
      window.removeEventListener("cafnet:business-owner-updated", handleEvents);
      window.removeEventListener("cafnet:managed-businesses-updated", handleEvents);
      window.removeEventListener("cafnet:review-moderation-updated", handleEvents);
    };
  }, []);

  const stats: AdminStats = getAdminStats(businesses);
  const pendingClaims = ownerState.claims.filter((c) => c.status === "pending");
  const pendingSubmissions = ownerState.submissions.filter((s) => s.status === "pending");
  const pendingReports = reports.filter((r) => r.status === "PENDING");

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Platform overview</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review business onboarding, verify claims, moderate reviews, and govern live listings across Cafnet.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending Claims */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Claims
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
              Submissions
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

        {/* Reported Reviews */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Reports
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {stats.pendingReportsCount}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">pending</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {stats.actionedReportsCount} removed · {stats.dismissedReportsCount} dismissed
          </p>
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Link
              href="/admin/reviews"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              Moderate reviews
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Live Businesses */}
        <div className="relative overflow-hidden rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Published
            </span>
            <span className="flex size-9 items-center justify-center rounded-xl bg-surface-container text-secondary">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
            </span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-on-surface">
              {stats.totalBusinessesCount}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">places</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
            {stats.verifiedBusinessesCount} verified businesses
          </p>
          <div className="mt-5 border-t border-outline-variant/60 pt-4">
            <Link
              href="/admin/businesses"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              View businesses
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Queues */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Pending Claims Queue */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-base font-bold text-on-surface">Pending claims</h2>
              <p className="text-xs text-on-surface-variant">Awaiting verification</p>
            </div>
            <Link
              href="/admin/claims"
              className="text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              All ({pendingClaims.length})
            </Link>
          </div>

          <div className="mt-4">
            {pendingClaims.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  check_circle
                </span>
                <p className="mt-2 text-xs">No pending claims.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {pendingClaims.slice(0, 3).map((claim) => {
                  const b = businesses.find((item) => item.id === claim.businessId);
                  return (
                    <div key={claim.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="truncate text-xs font-semibold text-on-surface">
                          {b?.name || `Business #${claim.businessId}`}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {new Date(claim.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <Link
                        href={`/admin/claims/${claim.id}`}
                        className="inline-flex h-7 items-center rounded-lg bg-primary-container px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
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
              <h2 className="text-base font-bold text-on-surface">Submissions</h2>
              <p className="text-xs text-on-surface-variant">New listings</p>
            </div>
            <Link
              href="/admin/submissions"
              className="text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              All ({pendingSubmissions.length})
            </Link>
          </div>

          <div className="mt-4">
            {pendingSubmissions.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  check_circle
                </span>
                <p className="mt-2 text-xs">No pending submissions.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {pendingSubmissions.slice(0, 3).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-xs font-semibold text-on-surface">
                        {sub.businessName}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {sub.category} · {sub.area}
                      </p>
                    </div>
                    <Link
                      href={`/admin/submissions/${sub.id}`}
                      className="inline-flex h-7 items-center rounded-lg bg-primary-container px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Pending Reports Queue */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-base font-bold text-on-surface">Reported reviews</h2>
              <p className="text-xs text-on-surface-variant">Review moderation queue</p>
            </div>
            <Link
              href="/admin/reviews"
              className="text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              All ({pendingReports.length})
            </Link>
          </div>

          <div className="mt-4">
            {pendingReports.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-3xl text-secondary">
                  check_circle
                </span>
                <p className="mt-2 text-xs">No pending review reports.</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/60">
                {pendingReports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="truncate text-xs font-semibold text-on-surface">
                        {report.businessName}
                      </p>
                      <p className="truncate text-[11px] text-on-surface-variant">
                        Reported for <span className="font-semibold">{report.reason}</span>
                      </p>
                    </div>
                    <Link
                      href={`/admin/reviews/${report.reviewId}`}
                      className="inline-flex h-7 items-center rounded-lg bg-primary-container px-2.5 text-[11px] font-bold text-primary transition-colors hover:bg-primary hover:text-white"
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
