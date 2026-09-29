import { api } from "./client";
import type { BusinessReport, BusinessReportReason, ReviewReport, ReviewReportReason } from "./types";

export interface CreateBusinessReportInput {
  reason: BusinessReportReason;
  details?: string;
}

export interface CreateReviewReportInput {
  reason: ReviewReportReason;
  explanation: string;
}

/**
 * Submit a community flag regarding inaccurate venue details or policy breaches.
 */
export async function reportBusiness(
  businessId: number,
  input: CreateBusinessReportInput,
): Promise<BusinessReport> {
  const response = await api.post<BusinessReport>(`/api/v1/businesses/${businessId}/reports`, input);
  return response.data;
}

/**
 * Submit a community flag against an inappropriate or fake review.
 */
export async function reportReview(
  reviewId: string,
  input: CreateReviewReportInput,
): Promise<ReviewReport> {
  const response = await api.post<ReviewReport>(`/api/v1/reviews/${reviewId}/reports`, input);
  return response.data;
}
