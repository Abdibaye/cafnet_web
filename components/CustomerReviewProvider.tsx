"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import { loadCustomerReviews, saveCustomerReviews, type CustomerReview } from "@/data/customerReviewStorage";
import { getBusinessReviews } from "@/data/mockReviews";

export function isReservationEligible(date: string, status: string) {
  const today = new Date().toISOString().slice(0, 10);
  return status !== "cancelled" && date <= today;
}

type CustomerReviewContextValue = {
  ready: boolean;
  reviews: CustomerReview[];
  getReviewsForBusiness: (businessId: number) => CustomerReview[];
  getCustomerReviewForBusiness: (businessId: number) => CustomerReview | undefined;
  getReviewForReservation: (reservationId: string) => CustomerReview | undefined;
  eligibleReservations: (businessId: number) => ReturnType<typeof useReservations>["reservations"];
  createReview: (reservationId: string, businessId: number, rating: number, text: string) => CustomerReview | null;
  updateReview: (reviewId: string, rating: number, text: string) => void;
};

const CustomerReviewContext = createContext<CustomerReviewContextValue | null>(null);

export function CustomerReviewProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCustomer();
  const { reservations } = useReservations();
  const [ready, setReady] = useState(false);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setReviews(loadCustomerReviews());
      setReady(true);
    });
  }, []);

  const createReview = (reservationId: string, businessId: number, rating: number, text: string) => {
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
    const next = [...reviews, review];
    setReviews(next);
    saveCustomerReviews(next);
    return review;
  };

  const updateReview = (reviewId: string, rating: number, text: string) => {
    if (rating < 1 || rating > 5 || text.length > 1000) return;
    const next = reviews.map((review) => review.id === reviewId ? { ...review, rating, text: text.trim(), date: "Just now" } : review);
    setReviews(next);
    saveCustomerReviews(next);
  };

  const customerReservations = currentUser ? reservations : [];
  return <CustomerReviewContext.Provider value={{
    ready,
    reviews,
    getReviewsForBusiness: (businessId) => reviews.filter((review) => review.businessId === businessId),
    getCustomerReviewForBusiness: (businessId) => reviews.find((review) => review.businessId === businessId),
    getReviewForReservation: (reservationId) => reviews.find((review) => review.reservationId === reservationId),
    eligibleReservations: (businessId) => customerReservations.filter((reservation) => reservation.businessId === businessId && isReservationEligible(reservation.date, reservation.status) && !reviews.some((review) => review.reservationId === reservation.id)),
    createReview,
    updateReview,
  }}>{children}</CustomerReviewContext.Provider>;
}

export function useCustomerReviews() {
  const context = useContext(CustomerReviewContext);
  if (!context) throw new Error("useCustomerReviews must be used inside CustomerReviewProvider");
  return context;
}

export function getCombinedBusinessReviews(businessId: number, customerReviews: CustomerReview[]) {
  return [...getBusinessReviews(businessId), ...customerReviews.filter((review) => review.businessId === businessId)];
}
