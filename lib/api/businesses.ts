import { api } from "./client";
import type {
  Business,
  BusinessFilterParams,
  Pagination,
  PublicBusinessProfile,
} from "./types";

export interface ListBusinessesResult {
  businesses: Business[];
  pagination?: Pagination;
}

/**
 * Lists public published businesses with optional category and neighborhood filtering.
 */
export async function listBusinesses(
  params: BusinessFilterParams = {},
): Promise<ListBusinessesResult> {
  const queryParams: Record<string, string | number | undefined> = {};
  if (params.category) queryParams.category = params.category;
  if (params.neighborhood) queryParams.neighborhood = params.neighborhood;
  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.offset !== undefined) queryParams.offset = params.offset;

  const res = await api.get<Business[]>("/api/v1/businesses", {
    params: queryParams,
  });

  return {
    businesses: res.data || [],
    pagination: res.pagination,
  };
}

/**
 * Retrieves the aggregated public profile for a single venue.
 * Supports both numeric ID and alphanumeric slug.
 */
export async function getBusinessProfile(
  idOrSlug: string | number,
): Promise<PublicBusinessProfile> {
  const res = await api.get<PublicBusinessProfile>(
    `/api/v1/businesses/${encodeURIComponent(String(idOrSlug))}`,
  );
  return res.data;
}

/**
 * Retrieves business basic information by URL slug.
 */
export async function getBusinessBySlug(slug: string): Promise<Business> {
  const res = await api.get<Business>(
    `/api/v1/slugs/${encodeURIComponent(slug)}`,
  );
  return res.data;
}

// ==========================================
// Business Management Endpoints (ReBAC Protected)
// ==========================================

/**
 * Returns all businesses managed by the authenticated user.
 */
export async function getManagedBusinesses(): Promise<Business[]> {
  const res = await api.get<Business[]>("/api/v1/businesses/managed");
  return res.data || [];
}

/**
 * Retrieves private management-level venue details for an authorized manager.
 */
export async function getManagedBusiness(id: number | string): Promise<Business> {
  const res = await api.get<Business>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}/manage`,
  );
  return res.data;
}

/**
 * Updates mutable profile metadata for a managed business.
 */
export async function updateManagedBusiness(
  id: number | string,
  input: import("./types").UpdateBusinessInput,
): Promise<Business> {
  const res = await api.patch<Business>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}`,
    input,
  );
  return res.data;
}

/**
 * Retrieves 7-day operating hours schedule for a managed business.
 */
export async function getBusinessHours(
  id: number | string,
): Promise<import("./types").BusinessHours[]> {
  const res = await api.get<import("./types").BusinessHours[]>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}/hours`,
  );
  return res.data || [];
}

/**
 * Replaces the 7-day operating hours schedule for a managed business.
 */
export async function setBusinessHours(
  id: number | string,
  hours: import("./types").BusinessHours[],
): Promise<{ updated: boolean }> {
  const res = await api.put<{ updated: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}/hours`,
    hours,
  );
  return res.data;
}

/**
 * Retrieves gallery images for a managed business.
 */
export async function getBusinessImages(
  id: number | string,
): Promise<import("./types").BusinessImage[]> {
  const res = await api.get<import("./types").BusinessImage[]>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}/images`,
  );
  return res.data || [];
}

/**
 * Replaces gallery images for a managed business.
 */
export async function setBusinessImages(
  id: number | string,
  images: import("./types").BusinessImage[],
): Promise<{ updated: boolean }> {
  const res = await api.put<{ updated: boolean }>(
    `/api/v1/businesses/${encodeURIComponent(String(id))}/images`,
    images,
  );
  return res.data;
}

