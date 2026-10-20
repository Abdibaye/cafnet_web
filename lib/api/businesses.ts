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
  if (params.creation_source) queryParams.creation_source = params.creation_source;
  if (params.claim_status) queryParams.claim_status = params.claim_status;
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

/**
 * Deletes a specific gallery image from a business profile.
 * Tries direct DELETE /api/v1/businesses/{id}/images/{imageId},
 * falling back to setBusinessImages excluding the target image.
 */
export async function deleteBusinessImage(
  businessId: number | string,
  imageId: string,
): Promise<{ deleted: boolean }> {
  try {
    const res = await api.delete<{ deleted: boolean }>(
      `/api/v1/businesses/${encodeURIComponent(String(businessId))}/images/${encodeURIComponent(imageId)}`,
    );
    return res.data;
  } catch {
    const current = await getBusinessImages(businessId);
    const updated = current.filter((img) => img.id !== imageId);
    await setBusinessImages(businessId, updated);
    return { deleted: true };
  }
}

/**
 * Submits a new business for admin review.
 * Uses the canonical endpoint POST /api/v1/businesses/submissions.
 */
export async function submitBusiness(
  input: import("./types").CreateSubmissionInput,
): Promise<import("./types").BusinessSubmission> {
  const res = await api.post<import("./types").BusinessSubmission>(
    "/api/v1/businesses/submissions",
    input,
  );
  return res.data;
}

/**
 * Returns businesses managed by the current user from Business Center.
 * Uses GET /api/v1/business-center/managed.
 */
export async function getBusinessCenterManaged(): Promise<Business[]> {
  const res = await api.get<Business[]>("/api/v1/business-center/managed");
  return res.data || [];
}

/**
 * Permanently deletes a business from the platform. Requires admin role.
 */
export async function deleteBusiness(
  businessId: number | string,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/api/v1/admin/businesses/${encodeURIComponent(String(businessId))}`,
  );
  return res.data;
}


