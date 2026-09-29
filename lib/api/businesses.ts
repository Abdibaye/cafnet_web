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
