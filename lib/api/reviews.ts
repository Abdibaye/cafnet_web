import { api } from "./client";
import type {
  Review,
  ReviewSummary,
  ReviewReport,
  CreateReviewInput,
  UpdateReviewInput,
  ReviewReportInput,
} from "./types";

/**
 * Lists public reviews for a business.
 */
export async function listBusinessReviews(
  businessId: number,
  params?: { limit?: number; offset?: number },
): Promise<Review[]> {
  const res = await api.get<Review[]>(`/api/v1/businesses/${businessId}/reviews`, {
    params,
  });
  return res.data || [];
}

/**
 * Gets aggregated review summary statistics for a business.
 */
export async function getReviewSummary(
  businessId: number,
): Promise<ReviewSummary> {
  const res = await api.get<ReviewSummary>(
    `/api/v1/businesses/${businessId}/reviews/summary`,
  );
  return res.data;
}

/**
 * Submits a verified review for a completed dining visit.
 * Backend canonical validation requires reservation_id to belong to the customer
 * and be in COMPLETED status.
 */
export async function createReview(
  input: CreateReviewInput,
): Promise<Review> {
  const payload = {
    reservation_id: input.reservation_id,
    rating: input.rating,
    review_text: input.review_text,
  };
  const res = await api.post<Review>("/api/v1/reviews", payload);
  return res.data;
}

/**
 * Updates an existing review written by the authenticated author.
 */
export async function updateReview(
  id: string,
  input: UpdateReviewInput,
): Promise<Review> {
  const payload = {
    rating: input.rating,
    review_text: input.review_text,
  };
  const res = await api.patch<Review>(`/api/v1/reviews/${id}`, payload);
  return res.data;
}

/**
 * Soft-deletes a review written by the authenticated author.
 */
export async function deleteReview(
  id: string,
): Promise<{ deleted: boolean }> {
  const res = await api.delete<{ deleted: boolean }>(`/api/v1/reviews/${id}`);
  return res.data;
}

/**
 * Casts a helpful upvote for a review.
 */
export async function markReviewHelpful(
  id: string,
): Promise<{ helpful: boolean }> {
  const res = await api.post<{ helpful: boolean }>(`/api/v1/reviews/${id}/helpful`);
  return res.data;
}

/**
 * Removes a helpful upvote from a review.
 */
export async function unmarkReviewHelpful(
  id: string,
): Promise<{ helpful: boolean }> {
  const res = await api.delete<{ helpful: boolean }>(`/api/v1/reviews/${id}/helpful`);
  return res.data;
}

/**
 * Lists all reviews written by the authenticated customer.
 */
export async function listMyReviews(): Promise<Review[]> {
  const res = await api.get<Review[]>("/api/v1/reviews/mine");
  return res.data || [];
}

/**
 * Flags an inappropriate or fake review for administrative moderation.
 */
export async function reportReview(
  reviewId: string,
  input: ReviewReportInput,
): Promise<ReviewReport> {
  const payload = {
    reason: input.reason,
    explanation: input.explanation,
  };
  const res = await api.post<ReviewReport>(
    `/api/v1/reviews/${reviewId}/reports`,
    payload,
  );
  return res.data;
}
