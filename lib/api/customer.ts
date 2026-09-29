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
