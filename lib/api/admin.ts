import { api } from "./client";
import type {
  AdminAction,
  AdminCreateBusinessInput,
  AdminStats,
  Business,
  BusinessClaim,
  BusinessReport,
  BusinessSubmission,
  CanonicalDish,
  DishAlias,
  PublicationStatus,
  ReportStatus,
  Review,
  ReviewReport,
  ReviewStatus,
  VerificationStatus,
} from "./types";

export interface ListAdminFilterParams {
  status?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Returns summary aggregate counters for the Admin Dashboard.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get<AdminStats>("/api/v1/admin/stats");
  return res.data;
}

/**
 * List venue submissions with optional status filter (PENDING, APPROVED, REJECTED, ALL).
 */
export async function listSubmissions(params?: ListAdminFilterParams): Promise<BusinessSubmission[]> {
  const res = await api.get<BusinessSubmission[]>("/api/v1/admin/submissions", { params });
  return res.data || [];
}

/**
 * Retrieve a single business submission by ID.
 */
export async function getSubmission(id: string): Promise<BusinessSubmission> {
  const res = await api.get<BusinessSubmission>(`/api/v1/admin/submissions/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Approve a venue submission, creating the business and granting primary ownership to submitter.
 */
export async function approveSubmission(id: string): Promise<Business> {
  const res = await api.post<Business>(`/api/v1/admin/submissions/${encodeURIComponent(id)}/approve`);
  return res.data;
}

/**
 * Reject a venue submission with a required audit reason.
 */
export async function rejectSubmission(id: string, reason: string): Promise<{ rejected: boolean }> {
  const res = await api.post<{ rejected: boolean }>(`/api/v1/admin/submissions/${encodeURIComponent(id)}/reject`, { reason });
  return res.data;
}

/**
 * List business ownership claims with optional status filter.
 */
export async function listClaims(params?: ListAdminFilterParams): Promise<BusinessClaim[]> {
  const res = await api.get<BusinessClaim[]>("/api/v1/admin/claims", { params });
  return res.data || [];
}

/**
 * Retrieve a single business claim by ID.
 */
export async function getClaim(id: string): Promise<BusinessClaim> {
  const res = await api.get<BusinessClaim>(`/api/v1/admin/claims/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Approve a venue claim, assigning the claimant as primary owner.
 */
export async function approveClaim(id: string, notes?: string): Promise<{ approved: boolean }> {
  const res = await api.post<{ approved: boolean }>(`/api/v1/admin/claims/${encodeURIComponent(id)}/approve`, { notes });
  return res.data;
}

/**
 * Reject a business claim with an audit reason.
 */
export async function rejectClaim(id: string, reason: string): Promise<{ rejected: boolean }> {
  const res = await api.post<{ rejected: boolean }>(`/api/v1/admin/claims/${encodeURIComponent(id)}/reject`, { reason });
  return res.data;
}

/**
 * List community reports filed against reviews.
 */
export async function listReviewReports(params?: ListAdminFilterParams): Promise<ReviewReport[]> {
  const res = await api.get<ReviewReport[]>("/api/v1/admin/reviews/reports", { params });
  return res.data || [];
}

/**
 * Retrieve a single review report by ID.
 */
export async function getReviewReport(id: string): Promise<ReviewReport> {
  const res = await api.get<ReviewReport>(`/api/v1/admin/reviews/reports/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Retrieve a single review for administrative inspection.
 */
export async function getReview(id: string): Promise<Review> {
  const res = await api.get<Review>(`/api/v1/admin/reviews/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Resolve or dismiss a review report.
 */
export async function resolveReviewReport(
  id: string,
  status: ReportStatus,
  action?: string,
): Promise<{ resolved: boolean }> {
  const res = await api.post<{ resolved: boolean }>(
    `/api/v1/admin/reviews/reports/${encodeURIComponent(id)}/resolve`,
    { status, action },
  );
  return res.data;
}

/**
 * Moderates a review (e.g. VISIBLE or REMOVED_BY_ADMIN) and triggers rating recalculation.
 */
export async function moderateReview(
  id: string,
  status: ReviewStatus,
  reason: string,
): Promise<{ moderated: boolean }> {
  const res = await api.post<{ moderated: boolean }>(
    `/api/v1/admin/reviews/${encodeURIComponent(id)}/moderate`,
    { status, reason },
  );
  return res.data;
}

/**
 * List community reports filed against venues.
 */
export async function listBusinessReports(params?: ListAdminFilterParams): Promise<BusinessReport[]> {
  const res = await api.get<BusinessReport[]>("/api/v1/admin/business-reports", { params });
  return res.data || [];
}

/**
 * Retrieve a single business report by ID.
 */
export async function getBusinessReport(id: string): Promise<BusinessReport> {
  const res = await api.get<BusinessReport>(`/api/v1/admin/business-reports/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Resolve or dismiss a business report.
 */
export async function resolveBusinessReport(
  id: string,
  status: ReportStatus,
  notes?: string,
): Promise<{ resolved: boolean }> {
  const res = await api.post<{ resolved: boolean }>(
    `/api/v1/admin/business-reports/${encodeURIComponent(id)}/resolve`,
    { status, notes },
  );
  return res.data;
}

/**
 * Toggle public discovery visibility of a venue.
 */
export async function setBusinessPublication(
  id: number,
  status: PublicationStatus,
): Promise<{ updated: boolean }> {
  const res = await api.post<{ updated: boolean }>(
    `/api/v1/admin/businesses/${id}/publication`,
    { status },
  );
  return res.data;
}

/**
 * Toggle official verified badge of a venue.
 */
export async function setBusinessVerification(
  id: number,
  status: VerificationStatus,
): Promise<{ updated: boolean }> {
  const res = await api.post<{ updated: boolean }>(
    `/api/v1/admin/businesses/${id}/verification`,
    { status },
  );
  return res.data;
}

/**
 * List immutable administrative audit actions.
 */
export async function listAdminActions(params?: { limit?: number; offset?: number }): Promise<AdminAction[]> {
  const res = await api.get<AdminAction[]>("/api/v1/admin/actions", { params });
  return res.data || [];
}

/**
 * Create a canonical business listing directly from the Admin Center without an initial owner.
 */
export async function createBusiness(input: AdminCreateBusinessInput): Promise<Business> {
  const res = await api.post<Business>("/api/v1/admin/businesses", input);
  return res.data;
}

/**
 * List canonical dishes with optional search and pagination.
 */
export async function listAdminDishes(params?: { q?: string; limit?: number; offset?: number }): Promise<CanonicalDish[]> {
  const res = await api.get<CanonicalDish[]>("/api/v1/admin/dishes", { params });
  return res.data || [];
}

/**
 * Retrieve a canonical dish and its aliases by ID.
 */
export async function getAdminDish(id: string): Promise<CanonicalDish> {
  const res = await api.get<CanonicalDish>(`/api/v1/admin/dishes/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Create a new canonical dish.
 */
export async function createAdminDish(input: {
  name: string;
  slug?: string;
  description?: string;
  cuisine_id?: number | null;
}): Promise<CanonicalDish> {
  const res = await api.post<CanonicalDish>("/api/v1/admin/dishes", input);
  return res.data;
}

/**
 * Update an existing canonical dish.
 */
export async function updateAdminDish(
  id: string,
  input: {
    name?: string;
    slug?: string;
    description?: string;
    cuisine_id?: number | null;
  },
): Promise<CanonicalDish> {
  const res = await api.put<CanonicalDish>(`/api/v1/admin/dishes/${encodeURIComponent(id)}`, input);
  return res.data;
}

/**
 * Delete a canonical dish (safely nullifying menu item references).
 */
export async function deleteAdminDish(id: string): Promise<{ deleted: boolean }> {
  const res = await api.delete<{ deleted: boolean }>(`/api/v1/admin/dishes/${encodeURIComponent(id)}`);
  return res.data;
}

/**
 * Add an alias to a canonical dish.
 */
export async function addAdminDishAlias(
  dishId: string,
  input: { alias: string; language?: string },
): Promise<DishAlias> {
  const res = await api.post<DishAlias>(`/api/v1/admin/dishes/${encodeURIComponent(dishId)}/aliases`, input);
  return res.data;
}

/**
 * Delete an alias from a canonical dish.
 */
export async function deleteAdminDishAlias(aliasId: string): Promise<{ deleted: boolean }> {
  const res = await api.delete<{ deleted: boolean }>(`/api/v1/admin/aliases/${encodeURIComponent(aliasId)}`);
  return res.data;
}

/**
 * Map or unmap a restaurant menu item to a canonical dish.
 */
export async function mapMenuItemCanonicalDish(
  itemId: string,
  canonicalDishId: string | null,
): Promise<{ mapped: boolean }> {
  const res = await api.put<{ mapped: boolean }>(`/api/v1/admin/menu-items/${encodeURIComponent(itemId)}/canonical`, {
    canonical_dish_id: canonicalDishId,
  });
  return res.data;
}

/**
 * Permanently delete a business and all its related data from the platform.
 */
export async function deleteBusiness(
  id: string | number,
): Promise<{ success: boolean; message: string }> {
  const res = await api.delete<{ success: boolean; message: string }>(
    `/api/v1/admin/businesses/${encodeURIComponent(String(id))}`,
  );
  return res.data;
}

export const adminApi = {
  getAdminStats,
  createBusiness,
  deleteBusiness,
  listSubmissions,
  getSubmission,
  approveSubmission,
  rejectSubmission,
  listClaims,
  getClaim,
  approveClaim,
  rejectClaim,
  listReviewReports,
  getReviewReport,
  getReview,
  resolveReviewReport,
  moderateReview,
  listBusinessReports,
  getBusinessReport,
  resolveBusinessReport,
  setBusinessPublication,
  setBusinessVerification,
  listAdminActions,
  listAdminDishes,
  getAdminDish,
  createAdminDish,
  updateAdminDish,
  deleteAdminDish,
  addAdminDishAlias,
  deleteAdminDishAlias,
  mapMenuItemCanonicalDish,
};

