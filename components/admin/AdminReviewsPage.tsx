"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  loadReviewReports,
  isReviewRemoved,
  type ReviewReport,
} from "@/data/reviewReportStorage";

export default function AdminReviewsPage() {
  const [reports, setReports] = useState<ReviewReport[]>(() => loadReviewReports());
  const [filter, setFilter] = useState<string>("pending");

  const reload = () => {
    setReports(loadReviewReports());
  };

  useEffect(() => {
    reload();
    const handleUpdate = () => reload();
    window.addEventListener("cafnet:review-moderation-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:review-moderation-updated", handleUpdate);
  }, []);

  const pendingReports = reports.filter((r) => r.status === "PENDING");
  const dismissedReports = reports.filter((r) => r.status === "DISMISSED");
  const actionedReports = reports.filter((r) => r.status === "ACTIONED");

  const filtered = reports.filter((report) => {
    if (filter === "all") return true;
    if (filter === "pending") return report.status === "PENDING";
    if (filter === "dismissed") return report.status === "DISMISSED";
    if (filter === "actioned") return report.status === "ACTIONED";
    return true;
  });

  const getEmptyMessage = () => {
    if (filter === "pending") {
      return {
        title: "No reported reviews.",
        subtitle: "All caught up.",
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
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-secondary">
            rate_review
          </span>
          <h2 className="mt-3 text-base font-bold text-on-surface">
            {getEmptyMessage().title}
          </h2>
          <p className="mt-1 text-xs">{getEmptyMessage().subtitle}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((report) => {
            const isRemoved = isReviewRemoved(report.reviewId);
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
                      {report.businessName}
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

                  {/* Review snippet and reviewer */}
                  <div className="mt-2 text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Reviewer:</span> {report.reviewerName}{" "}
                    <span className="text-secondary tracking-widest ml-1">
                      {"★".repeat(report.reviewRating)}
                      {"☆".repeat(5 - report.reviewRating)}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-xs italic text-on-surface leading-5 bg-surface-container-low p-2 rounded-lg">
                    &ldquo;{report.reviewText}&rdquo;
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-on-surface-variant">
                    <span>
                      Reported {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {report.explanation && (
                      <span className="truncate max-w-xs">
                        Note: {report.explanation}
                      </span>
                    )}
                    {isRemoved && (
                      <span className="font-semibold text-red-600">Review hidden publicly</span>
                    )}
                  </div>
                </div>

                {/* Review Detail Action Link */}
                <div className="shrink-0 pt-2 sm:pt-0">
                  <Link
                    href={`/admin/reviews/${report.reviewId}`}
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
