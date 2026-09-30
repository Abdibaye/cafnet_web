import { api } from "./client";
import type { Business } from "./types";

/**
 * Returns all saved (bookmarked) businesses for the authenticated customer.
 */
export async function getSavedBusinesses(): Promise<Business[]> {
  const res = await api.get<Business[]>("/api/v1/saved");
  return res.data || [];
}

/**
 * Bookmarks a venue for the authenticated customer.
 */
export async function saveBusiness(businessId: number): Promise<{ saved: boolean }> {
  const res = await api.post<{ saved: boolean }>(`/api/v1/saved/${businessId}`);
  return res.data;
}

/**
 * Removes a venue bookmark for the authenticated customer.
 */
export async function unsaveBusiness(businessId: number): Promise<{ saved: boolean }> {
  const res = await api.delete<{ saved: boolean }>(`/api/v1/saved/${businessId}`);
  return res.data;
}

/**
 * Returns all followed businesses for the authenticated customer.
 */
export async function getFollowedBusinesses(): Promise<Business[]> {
  const res = await api.get<Business[]>("/api/v1/following");
  return res.data || [];
}

/**
 * Subscribes the authenticated customer to updates from a business.
 */
export async function followBusiness(businessId: number): Promise<{ following: boolean }> {
  const res = await api.post<{ following: boolean }>(`/api/v1/following/${businessId}`);
  return res.data;
}

/**
 * Unsubscribes the authenticated customer from updates from a business.
 */
export async function unfollowBusiness(businessId: number): Promise<{ following: boolean }> {
  const res = await api.delete<{ following: boolean }>(`/api/v1/following/${businessId}`);
  return res.data;
}

// ==========================================
// Venue Claims & Submissions
// ==========================================

/**
 * Submits an ownership claim request for an existing business.
 */
export async function submitClaim(
  businessId: number,
): Promise<import("./types").BusinessClaim> {
  const res = await api.post<import("./types").BusinessClaim>("/api/v1/claims", {
    business_id: businessId,
  });
  return res.data;
}

/**
 * Lists claims submitted by the current authenticated user.
 */
export async function getMyClaims(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<import("./types").BusinessClaim[]> {
  const queryParams: Record<string, number | undefined> = {};
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get<import("./types").BusinessClaim[]>("/api/v1/claims", {
    params: queryParams,
  });
  return res.data || [];
}

/**
 * Retrieves single claim details by ID.
 */
export async function getMyClaim(
  id: string,
): Promise<import("./types").BusinessClaim> {
  const res = await api.get<import("./types").BusinessClaim>(
    `/api/v1/claims/${encodeURIComponent(id)}`,
  );
  return res.data;
}

/**
 * Submits a new venue recommendation for review.
 */
export async function createSubmission(
  input: import("./types").CreateSubmissionInput,
): Promise<import("./types").BusinessSubmission> {
  const res = await api.post<import("./types").BusinessSubmission>(
    "/api/v1/submissions",
    input,
  );
  return res.data;
}

/**
 * Lists submissions created by the current authenticated user.
 */
export async function getMySubmissions(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<import("./types").BusinessSubmission[]> {
  const queryParams: Record<string, number | undefined> = {};
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get<import("./types").BusinessSubmission[]>(
    "/api/v1/submissions",
    {
      params: queryParams,
    },
  );
  return res.data || [];
}

/**
 * Retrieves single submission details by ID.
 */
export async function getMySubmission(
  id: string,
): Promise<import("./types").BusinessSubmission> {
  const res = await api.get<import("./types").BusinessSubmission>(
    `/api/v1/submissions/${encodeURIComponent(id)}`,
  );
  return res.data;
}

