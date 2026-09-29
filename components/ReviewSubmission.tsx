"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useCustomerReviews } from "@/components/CustomerReviewProvider";
import type { MockBusiness } from "@/data/mockBusinesses";

export default function ReviewSubmission({ business }: { business: MockBusiness }) {
  const { isAuthenticated, startSignIn } = useCustomer();
  const {
    ready,
    eligibleReservations,
    getReviewForReservation,
    getCustomerReviewForBusiness,
    createReview,
    updateReview,
  } = useCustomerReviews();
  const [awaitingAuth, setAwaitingAuth] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [step, setStep] = useState<"idle" | "form" | "posted">("idle");
  const [editingReviewId, setEditingReviewId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reservations = ready ? eligibleReservations(business.id) : [];
  const existingReview = selectedReservationId
    ? getReviewForReservation(selectedReservationId)
    : undefined;
  const customerReviewForBusiness = ready
    ? getCustomerReviewForBusiness(business.id)
    : undefined;

  useEffect(() => {
    if (awaitingAuth && isAuthenticated) {
      queueMicrotask(() => {
        setAwaitingAuth(false);
        const nextReservations = eligibleReservations(business.id);
        if (nextReservations.length > 0) {
          setSelectedReservationId(nextReservations[0].id);
          setStep("form");
        }
      });
    }
  }, [awaitingAuth, isAuthenticated, business.id, eligibleReservations]);

  const begin = () => {
    if (!isAuthenticated) {
      setAwaitingAuth(true);
      startSignIn();
      return;
    }
    if (reservations.length > 0) {
      setSelectedReservationId(reservations[0].id);
      setStep("form");
    }
  };

  const editReview = () => {
    const review = customerReviewForBusiness;
    if (!review) return;
    setEditingReviewId(review.id);
    setRating(review.rating);
    setText(review.text);
    setStep("form");
  };

  const submit = async () => {
    if (!rating || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingReviewId) {
        const ok = await updateReview(editingReviewId, rating, text);
        if (ok) setStep("posted");
      } else {
        const res = await createReview(selectedReservationId, business.id, rating, text);
        if (res) setStep("posted");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === "posted") {
    return (
      <div className="mt-6 border border-outline-variant bg-surface-container-low p-5">
        <p className="text-sm font-bold text-on-surface">Review posted</p>
        <p className="mt-2 text-sm text-on-surface-variant">Thanks for sharing your experience.</p>
        <p
          className="mt-3 text-sm tracking-[0.12em] text-secondary"
          aria-label={`${rating} out of 5 stars`}
        >
          {"★".repeat(rating)}
          {"☆".repeat(5 - rating)} <span className="sr-only">{rating} out of 5 stars</span>
        </p>
        {text && <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">
            verified
          </span>
          Verified visit
        </span>
        <div className="mt-4 flex gap-3">
          <Link href="#reviews" className="text-sm font-semibold text-primary">
            View your review
          </Link>
          <Link
            href={`/business/${business.id}`}
            className="text-sm font-semibold text-on-surface-variant"
          >
            Back to restaurant
          </Link>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="mt-6 border border-outline-variant bg-white p-5">
        <button
          type="button"
          className="text-sm font-semibold text-primary"
          onClick={() => setStep("idle")}
        >
          ← Back
        </button>
        <h3 className="mt-5 text-lg font-bold text-on-surface">
          {editingReviewId ? "Edit your review" : "Tell us about your experience"}
        </h3>
        <p className="mt-2 text-sm text-on-surface-variant">
          Share your experience to help others decide where to eat.
        </p>
        <div className="mt-5 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className="flex size-10 items-center justify-center text-2xl text-secondary focus-visible:outline-2 focus-visible:outline-primary"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
            >
              {rating >= value ? "★" : "☆"}
            </button>
          ))}
        </div>
        <label htmlFor="review-text" className="mt-5 block text-sm font-semibold text-on-surface">
          Your review <span className="font-normal text-on-surface-variant">(optional)</span>
        </label>
        <textarea
          id="review-text"
          maxLength={1000}
          className="mt-2 min-h-28 w-full resize-y rounded-xl border border-outline-variant bg-background p-3 text-sm leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          placeholder="What did you like? How was the food, service, or atmosphere?"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
        <p className="mt-1 text-right text-xs text-on-surface-variant">{text.length}/1000</p>
        <button
          type="button"
          disabled={!rating || isSubmitting}
          className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          onClick={submit}
        >
          {isSubmitting
            ? editingReviewId
              ? "Saving..."
              : "Posting review..."
            : editingReviewId
              ? "Save changes"
              : "Post review"}
        </button>
      </div>
    );
  }

  if (!ready || !isAuthenticated) {
    return (
      <div className="mt-6">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:text-[#0f46b8]"
          onClick={begin}
        >
          Write a review
        </button>
        {!isAuthenticated && (
          <p className="mt-2 text-xs text-on-surface-variant">
            Reviews are available after you&apos;ve visited this place.
          </p>
        )}
      </div>
    );
  }

  if (reservations.length === 0 && !customerReviewForBusiness) {
    return (
      <p className="mt-4 text-sm text-on-surface-variant">
        Have you visited this place? Reviews are available after you&apos;ve visited this place.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-sm text-on-surface-variant">
        You have a qualifying visit to this place.
      </p>
      <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={begin}>
        {existingReview ? "Your review" : "Write a review"}
      </button>
      {existingReview && (
        <button
          type="button"
          className="ml-4 text-sm font-semibold text-on-surface-variant"
          onClick={editReview}
        >
          Edit review
        </button>
      )}
    </div>
  );
}
