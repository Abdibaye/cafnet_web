import { api } from "./client";
import type { BusinessUpdate } from "./types";

export interface ListUpdatesParams {
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * List active broadcasts across all published venues for public discovery feeds (Explore).
 */
export async function listActiveUpdates(params?: ListUpdatesParams): Promise<BusinessUpdate[]> {
  const response = await api.get<BusinessUpdate[]>("/api/v1/updates", { params });
  return response.data || [];
}

/**
 * List active broadcasts from venues followed by the authenticated user.
 */
export async function listFollowingUpdates(params?: ListUpdatesParams): Promise<BusinessUpdate[]> {
  const response = await api.get<BusinessUpdate[]>("/api/v1/following/updates", { params });
  return response.data || [];
}

/**
 * List active broadcasts for a specific business profile.
 */
export async function listBusinessUpdates(
  businessId: number,
  includeExpired = false,
): Promise<BusinessUpdate[]> {
  const response = await api.get<BusinessUpdate[]>(`/api/v1/businesses/${businessId}/updates`, {
    params: includeExpired ? { include_expired: true } : undefined,
  });
  return response.data || [];
}
