"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useCustomerReviews } from "@/components/CustomerReviewProvider";

export default function CustomerReviewsPage() {
  const { authReady, isAuthenticated, startSignIn, showToast } = useCustomer();
  const { ready, userReviews, deleteReview } = useCustomerReviews();

  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!authReady || !ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
        Loading reviews...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Sign in to see your reviews</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Reviews you post on Cafnet will appear here.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Sign in
        </button>
      </div>
    );
  }

  const handleConfirmDelete = async () => {
    if (!deletingReviewId) return;
    setIsDeleting(true);
    const success = await deleteReview(deletingReviewId);
    setIsDeleting(false);
    setDeletingReviewId(null);
    if (!success) {
      showToast("Could not delete review.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Your Cafnet
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">My reviews</h1>

      {userReviews.length === 0 ? (
        <div className="mt-10 border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-on-surface">No reviews yet.</h2>
          <p className="mt-3 text-sm text-on-surface-variant">
            After a visit, share your experience to help others decide where to eat.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
          >
            Explore places
          </Link>
        </div>
      ) : (
        <div className="mt-8 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-white shadow-sm">
          {userReviews.map((review) => {
            return (
              <article key={review.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-on-surface">
                      <Link
                        href={`/business/${review.businessId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {`Business #${review.businessId}`}
                      </Link>
                    </h2>
                    <p
                      className="mt-1 text-sm tracking-[0.12em] text-secondary"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </p>
                  </div>
                  <time className="text-xs text-on-surface-variant">{review.date}</time>
                </div>

                {review.text && (
                  <p className="mt-3 text-sm leading-6 text-on-surface-variant">{review.text}</p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/60 pt-3">
                  <div className="flex items-center gap-3">
                    {review.verifiedVisit && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
                          verified
                        </span>
                        Verified visit
                      </span>
                    )}
                    <Link
                      href={`/business/${review.businessId}#reviews`}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View on listing
                    </Link>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/business/${review.businessId}#reviews`}
                      className="text-xs font-semibold text-on-surface-variant hover:text-primary"
                    >
                      Edit
                    </Link>
                    <span className="text-outline-variant">·</span>
                    <button
                      type="button"
                      onClick={() => setDeletingReviewId(review.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
