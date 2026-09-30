"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listReviewReports, getReview } from "@/lib/api/admin";
import { listBusinesses } from "@/lib/api/businesses";
import type { ReviewReport, Review, Business } from "@/lib/api/types";

export default function AdminReviewsPage() {
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [reviewsMap, setReviewsMap] = useState<Record<string, Review>>({});
  const [businessesMap, setBusinessesMap] = useState<Record<number, Business>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const reportsData = await listReviewReports({
        status: filter === "all" ? "ALL" : filter.toUpperCase(),
      });
      const list = reportsData || [];
      setReports(list);

      // Fetch reviews and businesses for these reports
      const revMap: Record<string, Review> = {};
      const uniqueReviewIds = Array.from(new Set(list.map((r) => r.review_id)));
      await Promise.all(
        uniqueReviewIds.map(async (revId) => {
          try {
            const rev = await getReview(revId);
            if (rev) revMap[rev.id] = rev;
          } catch {
            // ignore individual review fetch failure
          }
        })
      );
      setReviewsMap(revMap);

      const uniqueBizIds = Array.from(
        new Set(Object.values(revMap).map((r) => r.business_id))
      );
      if (uniqueBizIds.length > 0) {
        try {
          const bizResult = await listBusinesses({ limit: 100 });
          const bMap: Record<number, Business> = {};
          for (const b of bizResult?.businesses || []) {
            bMap[b.id] = b;
          }
          setBusinessesMap(bMap);
        } catch {
          // ignore
        }
      }
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingReports = reports.filter((r) => r.status === "PENDING");
  const dismissedReports = reports.filter((r) => r.status === "DISMISSED");
  const actionedReports = reports.filter((r) => r.status === "ACTIONED");

  const getEmptyMessage = () => {
    if (filter === "pending") {
      return {
        title: "No pending reports.",
        subtitle: "All reported reviews are reviewed and resolved.",
      };
    }
    if (filter === "dismissed") {
      return {
        title: "No dismissed reports.",
        subtitle: "Dismissed reports will appear here for audit reference.",
      };
    }
    if (filter === "actioned") {
      return {
        title: "No actioned review reports.",
        subtitle: "Reviews removed by admin moderation will appear here.",
      };
    }
    return {
      title: "No reported reviews.",
      subtitle: "Customer reports will appear here when submitted.",
    };
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Review moderation</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review reported customer reviews, inspect violation context, and preserve community trust.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: "pending", label: "Pending", count: pendingReports.length },
          { key: "dismissed", label: "Dismissed", count: dismissedReports.length },
          { key: "actioned", label: "Actioned", count: actionedReports.length },
          { key: "all", label: "All Reports", count: reports.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
              filter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                filter === tab.key
                  ? "bg-primary-container text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-5"
            />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-secondary">rate_review</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">
            {getEmptyMessage().title}
          </h2>
          <p className="mt-1 text-xs">{getEmptyMessage().subtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const review = reviewsMap[report.review_id];
            const business = review ? businessesMap[review.business_id] : undefined;
            const isRemoved = review?.status === "REMOVED_BY_ADMIN";
            const isPending = report.status === "PENDING";
            const isDismissed = report.status === "DISMISSED";
            const isActioned = report.status === "ACTIONED";

            return (
              <div
                key={report.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-on-surface text-sm sm:text-base">
                      {business ? business.name : review ? `Business #${review.business_id}` : `Report #${report.id.slice(0, 8)}`}
                    </span>

                    {/* Status Badge */}
                    {isPending && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                        Pending
                      </span>
                    )}
                    {isDismissed && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                        Dismissed
                      </span>
                    )}
                    {isActioned && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                        Removed
                      </span>
                    )}

                    {/* Reason Badge */}
                    <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                      {report.reason}
                    </span>
                  </div>

                  {/* Review snippet and reviewer if available */}
                  {review && (
                    <div className="mt-2 text-xs text-on-surface-variant">
                      <span className="font-semibold text-on-surface">Reviewer:</span>{" "}
                      {review.customer_user_id}{" "}
                      <span className="text-secondary tracking-widest ml-1">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(Math.max(0, 5 - review.rating))}
                      </span>
                    </div>
                  )}

                  {review && review.review_text && (
                    <p className="mt-1 line-clamp-2 text-xs italic text-on-surface leading-5 bg-surface-container-low p-2 rounded-lg">
                      &ldquo;{review.review_text}&rdquo;
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant">
                    <span>
                      Reported{" "}
                      {new Date(report.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {report.explanation && (
                      <span className="truncate max-w-xs">Note: {report.explanation}</span>
                    )}
                    {isRemoved && (
                      <span className="font-semibold text-red-600">Review hidden publicly</span>
                    )}
                  </div>
                </div>

                {/* Review Detail Action Link */}
                <div className="shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/admin/reviews/${report.review_id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary-container px-4 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Review
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
