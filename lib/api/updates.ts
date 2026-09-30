import { api } from "./client";
import type {
  BusinessUpdate,
  CreateUpdateInput,
  UpdateUpdateInput,
} from "./types";

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
 * List broadcasts for a specific business.
 * For customers/public visitors, only non-expired published updates are returned.
 * When called with includeExpired=true by an authorized manager, returns all updates including expired.
 */
export async function listBusinessUpdates(
  businessId: number | string,
  includeExpired = false,
): Promise<BusinessUpdate[]> {
  const response = await api.get<BusinessUpdate[]>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/updates`,
    {
      params: includeExpired ? { include_expired: true } : undefined,
    },
  );
  return response.data || [];
}

/**
 * Alias for listBusinessUpdates.
 */
export const getBusinessUpdates = listBusinessUpdates;

/**
 * Broadcasts a new announcement, event, offer, new menu, or price update for a managed business.
 * Protected by ReBAC and IDOR verification.
 */
export async function createBusinessUpdate(
  businessId: number | string,
  input: CreateUpdateInput,
): Promise<BusinessUpdate> {
  const response = await api.post<BusinessUpdate>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/updates`,
    input,
  );
  return response.data;
}

/**
 * Modifies an existing broadcast update for a managed business.
 * Protected by ReBAC and IDOR verification.
 */
export async function updateBusinessUpdate(
  businessId: number | string,
  updateId: string,
  input: UpdateUpdateInput,
): Promise<BusinessUpdate> {
  const response = await api.patch<BusinessUpdate>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/updates/${encodeURIComponent(updateId)}`,
    input,
  );
  return response.data;
}

/**
 * Permanently soft-deletes a broadcast update.
 * Protected by ReBAC and IDOR verification.
 */
export async function deleteBusinessUpdate(
  businessId: number | string,
  updateId: string,
): Promise<{ deleted: boolean }> {
  const response = await api.delete<{ deleted: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(businessId))}/updates/${encodeURIComponent(updateId)}`,
  );
  return response.data;
}
