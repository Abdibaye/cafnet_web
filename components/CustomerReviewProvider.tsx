"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import {
  loadCustomerReviews,
  saveCustomerReviews,
  deleteCustomerReview,
  type CustomerReview,
} from "@/data/customerReviewStorage";
import { getBusinessReviews } from "@/data/mockReviews";
import { isReviewRemoved } from "@/data/reviewReportStorage";

export function isReservationEligible(date: string, status: string) {
  const today = new Date().toISOString().slice(0, 10);
  return status !== "cancelled" && date <= today;
}

type CustomerReviewContextValue = {
  ready: boolean;
  reviews: CustomerReview[];
  userReviews: CustomerReview[];
  getReviewsForBusiness: (businessId: number) => CustomerReview[];
  getCustomerReviewForBusiness: (businessId: number) => CustomerReview | undefined;
  getReviewForReservation: (reservationId: string) => CustomerReview | undefined;
  getReviewById: (reviewId: string) => CustomerReview | undefined;
  eligibleReservations: (businessId: number) => ReturnType<typeof useReservations>["reservations"];
  createReview: (reservationId: string, businessId: number, rating: number, text: string) => CustomerReview | null;
  updateReview: (reviewId: string, rating: number, text: string) => boolean;
  deleteReview: (reviewId: string) => boolean;
};

const CustomerReviewContext = createContext<CustomerReviewContextValue | null>(null);

export function CustomerReviewProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, showToast } = useCustomer();
  const { reservations } = useReservations();
  const [ready, setReady] = useState(false);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  const refreshReviews = useCallback(() => {
    const loaded = loadCustomerReviews().filter((r) => !isReviewRemoved(r.id));
    setReviews(loaded);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshReviews();
      setReady(true);
    });

    const handleUpdate = () => refreshReviews();
    window.addEventListener("cafnet:reviews-updated", handleUpdate);
    window.addEventListener("cafnet:review-moderation-updated", handleUpdate);

    return () => {
      window.removeEventListener("cafnet:reviews-updated", handleUpdate);
      window.removeEventListener("cafnet:review-moderation-updated", handleUpdate);
    };
  }, [refreshReviews]);

  const createReview = (reservationId: string, businessId: number, rating: number, text: string): CustomerReview | null => {
    if (!currentUser || rating < 1 || rating > 5 || text.length > 1000) return null;
    if (reviews.some((review) => review.reservationId === reservationId)) return null;

    const review: CustomerReview = {
      id: `customer-review-${Date.now()}`,
      businessId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      customerId: currentUser.id,
      reservationId,
      rating,
      text: text.trim(),
      date: "Just now",
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
      helpfulByCustomer: [],
      verifiedVisit: true,
    };

    const next = [review, ...reviews];
    setReviews(next);
    saveCustomerReviews(next);
    showToast("Review posted");
    return review;
  };

  const updateReview = (reviewId: string, rating: number, text: string): boolean => {
    if (rating < 1 || rating > 5 || text.length > 1000) return false;
    const exists = reviews.some((r) => r.id === reviewId);
    if (!exists) return false;

    const next = reviews.map((review) =>
      review.id === reviewId ? { ...review, rating, text: text.trim(), date: "Just now" } : review
    );
    setReviews(next);
    saveCustomerReviews(next);
    showToast("Review updated");
    return true;
  };

  const deleteReview = (reviewId: string): boolean => {
    if (!currentUser) return false;
    const target = reviews.find((r) => r.id === reviewId);
    if (!target || target.customerId !== currentUser.id) return false;

    const success = deleteCustomerReview(reviewId, currentUser.id);
    if (success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast("Review deleted");
    }
    return success;
  };

  const customerReservations = currentUser ? reservations : [];
  const userReviews = currentUser ? reviews.filter((r) => r.customerId === currentUser.id) : [];

  return (
    <CustomerReviewContext.Provider value={{
      ready,
      reviews,
      userReviews,
      getReviewsForBusiness: (businessId) => reviews.filter((review) => review.businessId === businessId),
      getCustomerReviewForBusiness: (businessId) => reviews.find((review) => review.businessId === businessId),
      getReviewForReservation: (reservationId) => reviews.find((review) => review.reservationId === reservationId),
      getReviewById: (reviewId) => reviews.find((review) => review.id === reviewId),
      eligibleReservations: (businessId) =>
        customerReservations.filter(
          (reservation) =>
            reservation.businessId === businessId &&
            isReservationEligible(reservation.date, reservation.status) &&
            !reviews.some((review) => review.reservationId === reservation.id)
        ),
      createReview,
      updateReview,
      deleteReview,
    }}>
      {children}
    </CustomerReviewContext.Provider>
  );
}

export function useCustomerReviews() {
  const context = useContext(CustomerReviewContext);
  if (!context) throw new Error("useCustomerReviews must be used inside CustomerReviewProvider");
  return context;
}

export function getCombinedBusinessReviews(businessId: number, customerReviews: CustomerReview[]) {
  return [
    ...customerReviews.filter((review) => review.businessId === businessId && !isReviewRemoved(review.id)),
    ...getBusinessReviews(businessId),
  ];
}
