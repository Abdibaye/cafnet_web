import type { MockReview } from "@/data/mockReviews";

export type CustomerReview = MockReview & {
  customerId: string;
  reservationId: string;
  createdAt: string;
  helpfulByCustomer: string[];
};

const storageKey = "cafnet.mock-customer-reviews";
const memoryFallbackReviews: CustomerReview[] = [];

export function loadCustomerReviews(): CustomerReview[] {
  if (typeof window === "undefined") return memoryFallbackReviews;
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
  if (typeof window === "undefined") {
    memoryFallbackReviews.length = 0;
    memoryFallbackReviews.push(...reviews);
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(reviews));
    window.dispatchEvent(new CustomEvent("cafnet:reviews-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function deleteCustomerReview(reviewId: string, customerId: string): boolean {
  const currentReviews = loadCustomerReviews();
  const target = currentReviews.find((r) => r.id === reviewId);
  if (!target) return false;
  if (target.customerId !== customerId) return false;

  const remaining = currentReviews.filter((r) => r.id !== reviewId);
  saveCustomerReviews(remaining);
  return true;
}
