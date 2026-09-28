"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loadReviewReports,
  isReviewRemoved,
  dismissReport,
  removeReviewByAdmin,
  type ReviewReport,
} from "@/data/reviewReportStorage";
import { getMockReviewById, type MockReview } from "@/data/mockReviews";
import { loadCustomerReviews, type CustomerReview } from "@/data/customerReviewStorage";
import { getBusinessById } from "@/data/mockBusinesses";
import { getHelpfulVotesCount } from "@/data/reviewHelpfulStorage";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminReviewDetailPage({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const { showToast } = useCustomer();

  const [reports, setReports] = useState<ReviewReport[]>(() => loadReviewReports());
  const [removed, setRemoved] = useState<boolean>(() => isReviewRemoved(reviewId));
  const [isDismissModalOpen, setIsDismissModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const reload = () => {
    setReports(loadReviewReports());
    setRemoved(isReviewRemoved(reviewId));
  };

  useEffect(() => {
    reload();
    const handleUpdate = () => reload();
    window.addEventListener("cafnet:review-moderation-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:review-moderation-updated", handleUpdate);
  }, [reviewId]);

  // Find report for this review
  const report = reports.find((r) => r.reviewId === reviewId);

  // Find the actual review (could be mock seed or customer submitted)
  const mockReview: MockReview | undefined = getMockReviewById(reviewId);
  const customerReview: CustomerReview | undefined = loadCustomerReviews().find((r) => r.id === reviewId);
  const review = customerReview || mockReview;

  // Resolve business
  const businessId = review?.businessId || report?.businessId;
  const business = businessId ? getBusinessById(businessId) : undefined;
  const businessName = business?.name || report?.businessName || `Business #${businessId}`;

  // If review is neither in reports nor in review storage, show not found
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

  const reviewerName = review?.userName || report?.reviewerName || "Customer";
  const reviewerAvatar = review?.userAvatar || reviewerName[0] || "C";
  const rating = review?.rating ?? report?.reviewRating ?? 5;
  const reviewText = review?.text ?? report?.reviewText ?? "";
  const verifiedVisit = review?.verifiedVisit ?? report?.verifiedVisit ?? false;
  const baseHelpful = review?.helpfulCount ?? 0;
  const helpfulCount = getHelpfulVotesCount(reviewId, baseHelpful);

  const isPending = report ? report.status === "PENDING" : false;
  const isDismissed = report ? report.status === "DISMISSED" : false;
  const isActioned = report ? report.status === "ACTIONED" : false;

  const handleDismissReport = () => {
    if (!report) return;
    setSubmitting(true);
    const result = dismissReport(report.id);
    setSubmitting(false);
    setIsDismissModalOpen(false);

    if (result.success) {
      showToast("Report dismissed — review remains visible");
      reload();
    } else {
      showToast(result.error || "Could not dismiss report.");
    }
  };

  const handleRemoveReview = () => {
    setSubmitting(true);
    const result = removeReviewByAdmin(reviewId, report?.id);
    setSubmitting(false);
    setIsRemoveModalOpen(false);

    if (result.success) {
      showToast("Review removed from public listings");
      reload();
    } else {
      showToast(result.error || "Could not remove review.");
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
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-3">
            <span
              className="flex size-10 items-center justify-center rounded-full bg-primary-container font-semibold text-primary"
              aria-hidden="true"
            >
              {reviewerAvatar}
            </span>
            <div>
              <h2 className="text-base font-bold text-on-surface">{reviewerName}</h2>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm tracking-[0.12em] text-secondary"
                  aria-label={`${rating} out of 5 stars`}
                >
                  {"★".repeat(rating)}
                  {"☆".repeat(5 - rating)}
                </span>
                <span className="text-xs text-on-surface-variant font-semibold">
                  {rating} / 5 stars
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            {verifiedVisit && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                Verified visit
              </span>
            )}
            <p className="text-xs text-on-surface-variant mt-0.5">
              Helpful votes: <span className="font-bold text-on-surface">{helpfulCount}</span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
            Review text
          </h3>
          <p className="mt-2 text-sm leading-7 text-on-surface whitespace-pre-wrap rounded-xl bg-surface-container-low p-4">
            {reviewText}
          </p>
        </div>
      </section>

      {/* Report Context Card (if reported) */}
      {report && (
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-outline-variant pb-4">
            <div>
              <h2 className="text-base font-bold text-on-surface">Report context</h2>
              <p className="text-xs text-on-surface-variant">
                Submitted by {report.reporterName || "Customer"}
              </p>
            </div>
            <div>
              {isPending && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                  Pending review
                </span>
              )}
              {isDismissed && (
                <span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                  Report dismissed
                </span>
              )}
              {isActioned && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                  Review removed
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <p className="font-bold uppercase tracking-wider text-secondary">Reported reason</p>
              <p className="mt-1 font-semibold text-on-surface text-sm capitalize">
                {report.reason}
              </p>
            </div>

            <div>
              <p className="font-bold uppercase tracking-wider text-secondary">Date reported</p>
              <p className="mt-1 text-on-surface">
                {new Date(report.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            {report.explanation && (
              <div className="sm:col-span-2">
                <p className="font-bold uppercase tracking-wider text-secondary">
                  Reporter explanation
                </p>
                <p className="mt-1 leading-5 text-on-surface bg-surface-container-low p-3 rounded-xl">
                  {report.explanation}
                </p>
              </div>
            )}

            {report.reviewedAt && (
              <div className="sm:col-span-2 border-t border-outline-variant/60 pt-3 text-on-surface-variant">
                Reviewed by <span className="font-semibold text-on-surface">{report.reviewedBy}</span> on{" "}
                {new Date(report.reviewedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Moderation Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">
            Moderation decision
          </p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Decisions take effect immediately across all customer views.
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          {/* Dismiss report button */}
          {report && isPending && (
            <button
              type="button"
              onClick={() => setIsDismissModalOpen(true)}
              className="flex-1 sm:flex-initial h-11 items-center justify-center rounded-xl border border-outline-variant px-5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
            >
              Dismiss report
            </button>
          )}

          {/* Remove review button */}
          {!removed ? (
            <button
              type="button"
              onClick={() => setIsRemoveModalOpen(true)}
              className="flex-1 sm:flex-initial h-11 items-center justify-center rounded-xl bg-red-600 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              Remove review
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="flex-1 sm:flex-initial h-11 items-center justify-center rounded-xl bg-surface-container px-5 text-xs font-bold text-on-surface-variant opacity-60 cursor-not-allowed"
            >
              Review already removed
            </button>
          )}
        </div>
      </div>

      {/* Dismiss Confirmation Modal */}
      {isDismissModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Dismiss this report?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              The review will remain visible to customers.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDismissModalOpen(false)}
                disabled={submitting}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDismissReport}
                disabled={submitting}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f46b8] disabled:opacity-50"
              >
                {submitting ? "Dismissing..." : "Dismiss report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {isRemoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Remove this review?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              The review will no longer be visible to customers.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRemoveModalOpen(false)}
                disabled={submitting}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveReview}
                disabled={submitting}
                className="h-10 rounded-xl bg-red-600 px-5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "Removing..." : "Remove review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
