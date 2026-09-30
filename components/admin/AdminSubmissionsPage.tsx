"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listSubmissions, getAdminStats } from "@/lib/api/admin";
import type { BusinessSubmission, AdminStats } from "@/lib/api/types";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadSubmissions = useCallback(async () => {
    try {
      setLoading(true);
      const [data, statsData] = await Promise.all([
        listSubmissions({
          status: statusFilter === "all" ? "ALL" : statusFilter.toUpperCase(),
          limit: 100,
        }),
        getAdminStats().catch(() => null),
      ]);
      setSubmissions(data || []);
      if (statsData) setStats(statsData);
    } catch {
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const pendingCount = stats?.pending_submissions ?? submissions.filter((s) => s.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Business submissions</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review new business listing requests and publish them to Cafnet.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: "all", label: "All Submissions", count: stats?.total_submissions ?? submissions.length },
          { key: "pending", label: "Pending", count: stats?.pending_submissions ?? pendingCount },
          { key: "approved", label: "Approved", count: stats?.approved_submissions ?? submissions.filter((s) => s.status === "APPROVED").length },
          { key: "rejected", label: "Rejected", count: stats?.rejected_submissions ?? submissions.filter((s) => s.status === "REJECTED").length },
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

      {/* Submissions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-5" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">post_add</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No submissions found</h2>
          <p className="mt-1 text-xs">There are no business submissions in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isApproved = sub.status === "APPROVED";
            const isRejected = sub.status === "REJECTED";
            const isPending = sub.status === "PENDING";

            return (
              <div
                key={sub.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-on-surface">{sub.business_name}</h2>
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
                      {isApproved ? "Published" : isRejected ? "Rejected" : "Pending review"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {sub.category === "cafe"
                      ? "Café"
                      : sub.category === "drinks"
                      ? "Drinks & More"
                      : "Restaurant"}{" "}
                    · {sub.area}
                  </p>

                  <p className="mt-2 text-[11px] text-outline">
                    Submitted on{" "}
                    {new Date(sub.submitted_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/submissions/${sub.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
                  >
                    {isPending ? "Review submission" : "View details"}
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
