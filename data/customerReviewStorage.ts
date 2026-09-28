import type { MockReview } from "@/data/mockReviews";

export type CustomerReview = MockReview & {
  customerId: string;
  reservationId: string;
  createdAt: string;
  helpfulByCustomer: string[];
};

const storageKey = "cafnet.mock-customer-reviews";

export function loadCustomerReviews(): CustomerReview[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((r): r is CustomerReview =>
      Boolean(
        r &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.businessId === "number" &&
        typeof r.rating === "number"
      )
    );
  } catch {
    return [];
  }
}

export function saveCustomerReviews(reviews: CustomerReview[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent("cafnet:reviews-updated"));
  } catch {
    // Ignore storage write failures
  }
}
