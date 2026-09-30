"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getReview,
  listReviewReports,
  moderateReview,
  resolveReviewReport,
} from "@/lib/api/admin";
import { getBusinessProfile } from "@/lib/api/businesses";
import type { Review, ReviewReport, Business } from "@/lib/api/types";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminReviewDetailPage({ reviewId }: { reviewId: string }) {
  const { showToast } = useCustomer();

  const [review, setReview] = useState<Review | null>(null);
  const [report, setReport] = useState<ReviewReport | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [moderationReason, setModerationReason] = useState("");
  const [moderationError, setModerationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [revData, reportsData] = await Promise.all([
        getReview(reviewId).catch(() => null),
        listReviewReports({ status: "ALL" }).catch(() => []),
      ]);

      setReview(revData);
      const matchedReport = (reportsData || []).find((r) => r.review_id === reviewId) || null;
      setReport(matchedReport);

      const targetBizId = revData?.business_id;
      if (targetBizId) {
        try {
          const bizData = await getBusinessProfile(targetBizId);
          setBusiness(bizData.business);
        } catch {
          setBusiness(null);
        }
      }
    } catch {
      setReview(null);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-outline-variant/40" />
        <div className="h-44 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
        <div className="h-60 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
      </div>
    );
  }

  if (!review && !report) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Review not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          No review or report found for ID &ldquo;{reviewId}&rdquo;.
        </p>
        <Link
          href="/admin/reviews"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm"
        >
          Return to reviews moderation
        </Link>
      </div>
    );
  }

  const businessName = business?.name || (review ? `Business #${review.business_id}` : "Business");
  const businessId = review?.business_id;
  const removed = review?.status === "REMOVED_BY_ADMIN";
  const isPending = report ? report.status === "PENDING" : false;
  const isDismissed = report ? report.status === "DISMISSED" : false;

  const handleDismissReport = async () => {
    if (!report) return;
    try {
      setSubmitting(true);
      await resolveReviewReport(report.id, "DISMISSED", "Report dismissed by admin review");
      showToast("Report dismissed — review remains visible");
      setIsDismissModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not dismiss report.";
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = moderationReason.trim();
    if (!trimmed) {
      setModerationError("Please provide a reason for removing this review.");
      return;
    }

    try {
      setSubmitting(true);
      await moderateReview(reviewId, "REMOVED_BY_ADMIN", trimmed);
      if (report && report.status === "PENDING") {
        await resolveReviewReport(report.id, "ACTIONED", trimmed);
      }
      showToast("Review removed from public listings");
      setIsRemoveModalOpen(false);
      setModerationReason("");
      setModerationError("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not remove review.";
      setModerationError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestoreReview = async () => {
    try {
      setSubmitting(true);
      await moderateReview(reviewId, "VISIBLE", "Restored to visible by admin");
      showToast("Review restored to public listings");
      setIsRestoreModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not restore review.";
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/reviews"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to review moderation
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-outline-variant pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
              Review Moderation
            </span>
            <span className="text-outline-variant">·</span>
            <span className="text-xs text-on-surface-variant font-mono">ID: {reviewId}</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-on-surface sm:text-3xl">
            Moderation inspection
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Listing:{" "}
            {businessId ? (
              <Link
                href={`/business/${businessId}`}
                target="_blank"
                className="font-semibold text-primary hover:underline"
              >
                {businessName}
              </Link>
            ) : (
              businessName
            )}
          </p>
        </div>

        {/* Public Status Badge */}
        <div className="flex items-center gap-2">
          {removed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700">
              <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              REMOVED FROM PUBLIC
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              PUBLICLY VISIBLE
            </span>
          )}
        </div>
      </div>

      {/* Audit Banner if already actioned */}
      {removed && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
          <span className="material-symbols-outlined text-[20px] text-red-600">gavel</span>
          <div>
            <p className="font-bold">This review was removed by platform moderation.</p>
            <p className="mt-0.5 text-red-700">
              It is hidden from customer profiles, business listings, and rating calculations.
            </p>
          </div>
        </div>
      )}

      {isDismissed && !removed && (
        <div className="flex items-start gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-secondary">verified</span>
          <div>
            <p className="font-bold text-on-surface">This report was dismissed.</p>
            <p className="mt-0.5">
              Admin confirmed this review complies with platform guidelines. The review remains public.
            </p>
          </div>
        </div>
      )}

      {/* Review Content Card */}
      {review && (
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {review.customer_user_id.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">User {review.customer_user_id}</p>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="text-secondary tracking-widest">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(Math.max(0, 5 - review.rating))}
                  </span>
                  <span>·</span>
                  <span>{new Date(review.created_at).toLocaleDateString("en-US")}</span>
                  {review.is_verified_visit && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Verified Visit
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <span className="text-xs text-on-surface-variant">
              {review.helpful_count} helpful votes
            </span>
          </div>

          <div className="mt-4">
            <p className="text-sm leading-6 text-on-surface whitespace-pre-wrap">
              {review.review_text}
            </p>
          </div>
        </section>
      )}

      {/* Report Context Card if present */}
      {report && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
              Report context
            </h2>
            <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold text-amber-900">
              Reason: {report.reason}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-xs text-amber-950">
            <p>
              <span className="font-semibold">Reporter ID:</span> {report.reporter_user_id}
            </p>
            <p>
              <span className="font-semibold">Reported At:</span>{" "}
              {new Date(report.created_at).toLocaleString("en-US")}
            </p>
            {report.explanation && (
              <div className="mt-2 rounded-xl bg-white/70 p-3 text-xs italic text-on-surface">
                &ldquo;{report.explanation}&rdquo;
              </div>
            )}
          </div>
        </section>
      )}

      {/* Moderation Actions Bar */}
      <section className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-end">
        {isPending && (
          <button
            type="button"
            onClick={() => setIsDismissModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Dismiss report
          </button>
        )}

        {!removed ? (
          <button
            type="button"
            onClick={() => setIsRemoveModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
          >
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            Remove review
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsRestoreModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <span className="material-symbols-outlined text-[18px]">visibility</span>
            Restore review
          </button>
        )}
      </section>

      {/* DISMISS CONFIRMATION MODAL */}
      {isDismissModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Dismiss report</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This report will be marked as dismissed. The review will remain visible to the public.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsDismissModalOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDismissReport}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] disabled:opacity-50"
              >
                {submitting ? "Dismissing..." : "Dismiss report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE REVIEW CONFIRMATION MODAL */}
      {isRemoveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Remove review from public</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Removing this review will hide it from the business profile and recalculate the
              business rating dynamically.
            </p>

            <form onSubmit={handleRemoveReview} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="remove-reason"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Removal reason *
                </label>
                <textarea
                  id="remove-reason"
                  rows={3}
                  autoFocus
                  placeholder="e.g. Violates community policy against offensive language or conflict of interest."
                  value={moderationReason}
                  onChange={(e) => {
                    setModerationReason(e.target.value);
                    if (moderationError) setModerationError("");
                  }}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-sm outline-none transition-colors ${
                    moderationError
                      ? "border-red-500 focus:border-red-500"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
                {moderationError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{moderationError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setIsRemoveModalOpen(false);
                    setModerationReason("");
                    setModerationError("");
                  }}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Removing..." : "Remove review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTORE REVIEW CONFIRMATION MODAL */}
      {isRestoreModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Restore review to public</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This will restore the review back to visible status and recalculate business review ratings.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setIsRestoreModalOpen(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleRestoreReview}
                className="h-10 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? "Restoring..." : "Restore review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
