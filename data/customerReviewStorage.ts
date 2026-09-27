import type { MockReview } from "@/data/mockReviews";

export type CustomerReview = MockReview & {
  customerId: string;
  reservationId: string;
  createdAt: string;
  helpfulByCustomer: string[];
};

const storageKey = "cafnet.mock-customer-reviews";

export function loadCustomerReviews() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) as CustomerReview[] : [];
  } catch {
    return [];
  }
}

export function saveCustomerReviews(reviews: CustomerReview[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reviews));
}
