"use client";

import { useState, useEffect } from "react";
import type { MockReview } from "@/data/mockReviews";
import { useCustomer } from "@/components/CustomerProvider";
import { useCustomerReviews } from "@/components/CustomerReviewProvider";
import {
  isReviewHelpfulVoted,
  getHelpfulVotesCount,
  toggleHelpfulVote,
} from "@/data/reviewHelpfulStorage";
import {
  createReviewReport,
  hasCustomerReportedReview,
  REPORT_REASONS,
  type ReportReason,
} from "@/data/reviewReportStorage";

type SortOption = "relevant" | "newest" | "highest" | "lowest";

type BusinessReviewsProps = {
  reviews: MockReview[];
  average: number;
  distribution: number[];
  businessName?: string;
};

const sortLabels: Record<SortOption, string> = {
  relevant: "Most relevant",
  newest: "Newest",
  highest: "Highest rated",
  lowest: "Lowest rated",
};

export default function BusinessReviews({
  reviews,
  average,
  distribution,
  businessName,
}: BusinessReviewsProps) {
  const { currentUser, requestAuth, showToast } = useCustomer();
  const { deleteReview } = useCustomerReviews();

  const [sort, setSort] = useState<SortOption>("relevant");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [helpfulRevision, setHelpfulRevision] = useState(0);

  // Modals state
  const [reportingReview, setReportingReview] = useState<MockReview | null>(null);
  const [reportReason, setReportReason] = useState<ReportReason>("spam");
  const [reportExplanation, setReportExplanation] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync helpful votes when storage updates
  useEffect(() => {
    const handleHelpfulUpdate = () => {
      setHelpfulRevision((prev) => prev + 1);
    };
    window.addEventListener("cafnet:helpful-votes-updated", handleHelpfulUpdate);
    return () => window.removeEventListener("cafnet:helpful-votes-updated", handleHelpfulUpdate);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdownId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-review-menu]")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId]);

  const maxCount = Math.max(...distribution, 1);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === "newest") return b.id.localeCompare(a.id);
    if (sort === "highest") return b.rating - a.rating || b.id.localeCompare(a.id);
    if (sort === "lowest") return a.rating - b.rating || b.id.localeCompare(a.id);
    const aHelpful = getHelpfulVotesCount(a.id, a.helpfulCount);
    const bHelpful = getHelpfulVotesCount(b.id, b.helpfulCount);
    return bHelpful - aHelpful || b.id.localeCompare(a.id);
  });

  const handleHelpfulClick = (review: MockReview) => {
    if (!currentUser) {
      requestAuth({
        callback: () => {
          toggleHelpfulVote(review.id, "mock-customer-abdi", review.helpfulCount);
          setHelpfulRevision((prev) => prev + 1);
        },
      });
      return;
    }

    toggleHelpfulVote(review.id, currentUser.id, review.helpfulCount);
    setHelpfulRevision((prev) => prev + 1);
  };

  const handleOpenReport = (review: MockReview) => {
    setOpenDropdownId(null);

    const proceedWithReporting = (userId: string) => {
      if (hasCustomerReportedReview(review.id, userId)) {
        showToast("You already reported this review.");
        return;
      }
      setReportingReview(review);
      setReportReason("spam");
      setReportExplanation("");
    };

    if (!currentUser) {
      requestAuth({
        callback: () => {
          proceedWithReporting("mock-customer-abdi");
        },
      });
      return;
    }

    proceedWithReporting(currentUser.id);
  };

  const handleSubmitReport = () => {
    if (!reportingReview || !currentUser) return;
    setReportSubmitting(true);

    const result = createReviewReport({
      reviewId: reportingReview.id,
      businessId: reportingReview.businessId,
      businessName: businessName || `Business #${reportingReview.businessId}`,
      reviewerName: reportingReview.userName,
      reviewerId: reportingReview.userId,
      reviewRating: reportingReview.rating,
      reviewText: reportingReview.text,
      verifiedVisit: reportingReview.verifiedVisit,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      reason: reportReason,
      explanation: reportExplanation,
    });

    setReportSubmitting(false);

    if (result.success) {
      setReportingReview(null);
      showToast("Report submitted. Thank you for helping keep Cafnet useful.");
    } else {
      showToast(result.error || "Could not submit report.");
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingReviewId) return;
    setIsDeleting(true);
    const success = deleteReview(deletingReviewId);
    setIsDeleting(false);
    setDeletingReviewId(null);
    if (!success) {
      showToast("Could not delete review.");
    }
  };

  const isCustomerOwnReview = (review: MockReview) => {
    if (!currentUser) return false;
    return review.userId === currentUser.id || (review as { customerId?: string }).customerId === currentUser.id;
  };

  if (reviews.length === 0) {
    return (
      <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-8 text-sm text-on-surface-variant">
        <p className="font-semibold text-on-surface">No reviews yet</p>
        <p className="mt-2">Be one of the first people to share your experience.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Rating summary */}
      <div className="mb-8 grid gap-8 border-b border-outline-variant pb-8 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
        <div>
          <p className="text-4xl font-bold text-on-surface">{average.toFixed(1)}</p>
          <p
            className="mt-1 text-sm tracking-[0.12em] text-secondary"
            aria-label={`${average.toFixed(1)} out of 5 stars`}
          >
            ★★★★★
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </p>
        </div>
        <div className="space-y-2" aria-label="Rating distribution">
          {distribution.map((count, index) => {
            const rating = 5 - index;
            return (
              <div key={rating} className="flex items-center gap-3 text-xs text-on-surface-variant">
                <span className="w-6 shrink-0">{rating} ★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sort header */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-on-surface">Customer experiences</h3>
        <label className="flex items-center gap-2 text-xs text-on-surface-variant">
          Sort by
          <select
            aria-label="Sort reviews"
            className="rounded-lg border border-outline-variant bg-white px-2 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Review list */}
      <div className="divide-y divide-outline-variant">
        {sortedReviews.map((review) => {
          const isExpanded = expanded.includes(review.id);
          const isLong = review.text.length > 130;
          const isOwner = isCustomerOwnReview(review);
          const hasVotedHelpful = currentUser
            ? isReviewHelpfulVoted(review.id, currentUser.id)
            : false;
          // Use helpfulRevision in expression to trigger re-renders
          const currentHelpfulCount =
            helpfulRevision >= 0 ? getHelpfulVotesCount(review.id, review.helpfulCount) : review.helpfulCount;

          return (
            <article key={review.id} className="py-6 first:pt-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container font-semibold text-primary"
                  aria-hidden="true"
                >
                  {review.userAvatar}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-on-surface">{review.userName}</h4>
                        {isOwner && (
                          <span className="rounded bg-secondary/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-secondary">
                            You
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-1 text-sm tracking-[0.12em] text-secondary"
                        aria-label={`${review.rating} out of 5 stars`}
                      >
                        ★★★★★ <span className="sr-only">{review.rating} out of 5 stars</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <time className="text-xs text-on-surface-variant">{review.date}</time>

                      {/* Options Dropdown menu (•••) */}
                      <div className="relative" data-review-menu>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdownId(openDropdownId === review.id ? null : review.id)
                          }
                          className="flex size-7 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                          aria-label="Review options"
                        >
                          <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                        </button>

                        {openDropdownId === review.id && (
                          <div className="absolute right-0 z-20 mt-1 min-w-[150px] rounded-xl border border-outline-variant bg-white p-1.5 shadow-lg">
                            {isOwner ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    // Scroll to review submission form if on page
                                    const form = document.getElementById("reviews");
                                    form?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                  Edit review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    setDeletingReviewId(review.id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                  Delete review
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenReport(review)}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container"
                              >
                                <span className="material-symbols-outlined text-[16px]">flag</span>
                                Report review
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p
                    className={`mt-3 text-sm leading-6 text-on-surface-variant ${
                      !isExpanded && isLong ? "line-clamp-2" : ""
                    }`}
                  >
                    {review.text}
                  </p>

                  {isLong && (
                    <button
                      type="button"
                      className="mt-1 text-xs font-semibold text-primary hover:text-[#0f46b8]"
                      onClick={() =>
                        setExpanded((current) =>
                          current.includes(review.id)
                            ? current.filter((id) => id !== review.id)
                            : [...current, review.id]
                        )
                      }
                    >
                      {isExpanded ? "Show less" : "Read more"}
                    </button>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                    {/* Helpful toggle */}
                    <button
                      type="button"
                      className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                        hasVotedHelpful ? "text-primary" : "hover:text-primary"
                      }`}
                      onClick={() => handleHelpfulClick(review)}
                      aria-label={`Mark review as helpful. Currently ${currentHelpfulCount}`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {hasVotedHelpful ? "thumb_up" : "thumb_up_off_alt"}
                      </span>
                      Helpful · {currentHelpfulCount}
                    </button>

                    {review.verifiedVisit && (
                      <span className="inline-flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-[15px] text-primary"
                          aria-hidden="true"
                        >
                          verified
                        </span>
                        Verified visit
                      </span>
                    )}

                    {/* Owner controls directly accessible */}
                    {isOwner && (
                      <div className="flex items-center gap-2 border-l border-outline-variant pl-3">
                        <button
                          type="button"
                          onClick={() => {
                            const form = document.getElementById("reviews");
                            form?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <span className="text-outline-variant">·</span>
                        <button
                          type="button"
                          onClick={() => setDeletingReviewId(review.id)}
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingReviewId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Delete your review?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This review will be removed from your profile and the business&apos;s review list.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingReviewId(null)}
                disabled={isDeleting}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Report review</h3>
                <p className="text-xs text-on-surface-variant">
                  Help keep Cafnet authentic and trustworthy
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl bg-surface-container-low p-3 text-xs">
                <p className="font-semibold text-on-surface">Review by {reportingReview.userName}:</p>
                <p className="mt-1 line-clamp-2 text-on-surface-variant italic">
                  &ldquo;{reportingReview.text}&rdquo;
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Reason for reporting
                </p>
                <div className="mt-2 space-y-2">
                  {REPORT_REASONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-colors ${
                        reportReason === opt.value
                          ? "border-primary bg-primary-container/20 text-on-surface"
                          : "border-outline-variant text-on-surface hover:bg-surface-container-low"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={opt.value}
                        checked={reportReason === opt.value}
                        onChange={() => setReportReason(opt.value)}
                        className="mt-0.5 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="mt-0.5 text-on-surface-variant">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="report-explanation" className="text-xs font-semibold text-on-surface">
                  Optional explanation
                </label>
                <textarea
                  id="report-explanation"
                  rows={3}
                  value={reportExplanation}
                  onChange={(e) => setReportExplanation(e.target.value)}
                  placeholder="Provide additional details to help moderators evaluate this review..."
                  className="mt-1.5 w-full rounded-xl border border-outline-variant p-3 text-xs text-on-surface outline-none focus:border-primary"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => setReportingReview(null)}
                disabled={reportSubmitting}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={reportSubmitting}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f46b8] disabled:opacity-50"
              >
                {reportSubmitting ? "Submitting..." : "Submit report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
