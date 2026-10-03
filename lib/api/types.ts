/**
 * Cafnet API Types
 * Canonical TypeScript definitions matching the Go domain models and REST envelopes.
 */

// Strongly typed enum values
export type UserRole = "CUSTOMER" | "ADMIN";

export type BusinessCategory = "restaurant" | "cafe" | "drinks";

export type PriceRange = "$" | "$$" | "$$$" | "$$$$";

export type PublicationStatus = "PUBLISHED" | "UNPUBLISHED";

export type VerificationStatus = "VERIFIED" | "UNVERIFIED";

export type ClaimStatus = "UNCLAIMED" | "CLAIMED";

export type CreationSource = "OWNER_SUBMISSION" | "ADMIN_CREATED";

export type ManagerRole = "PRIMARY_OWNER" | "MANAGER";

export type ClaimWorkflowStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SubmissionWorkflowStatus = "PENDING" | "APPROVED" | "REJECTED";

export type UpdateType =
  | "new_menu"
  | "offer"
  | "event"
  | "price_update"
  | "announcement"
  | "ANNOUNCEMENT"
  | "OFFER"
  | "EVENT";

export type UpdateStatus = "DRAFT" | "PUBLISHED" | "EXPIRED";

export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED";

export type ReviewStatus = "VISIBLE" | "REMOVED_BY_ADMIN";

export type ReviewReportReason = "spam" | "offensive" | "fake" | "other";

export type ReportStatus = "PENDING" | "DISMISSED" | "ACTIONED";

export type BusinessReportReason =
  | "WRONG_HOURS"
  | "WRONG_PHONE"
  | "WRONG_LOCATION"
  | "WRONG_INFORMATION"
  | "CLOSED"
  | "DUPLICATE"
  | "OTHER";

export type AdminActionType =
  | "BUSINESS_APPROVED"
  | "BUSINESS_REJECTED"
  | "CLAIM_APPROVED"
  | "CLAIM_REJECTED"
  | "REVIEW_REMOVED"
  | "REVIEW_REPORT_DISMISSED"
  | "BUSINESS_REPORT_ACTIONED"
  | "BUSINESS_REPORT_DISMISSED"
  | "PUBLICATION_STATUS_CHANGED"
  | "VERIFICATION_STATUS_CHANGED"
  | "BUSINESS_ADMIN_CREATED";

// Core Domain Models

export interface User {
  id: string;
  phone?: string;
  email?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  is_active: boolean;
  profile_completed?: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  user_agent?: string;
  ip_address?: string;
  expires_at: string;
  last_used_at?: string;
  revoked_at?: string;
  created_at: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  category: BusinessCategory;
  cuisine: string;
  description: string;
  short_description: string;
  location_name: string;
  neighborhood: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  website?: string;
  price_range: PriceRange;
  tags: string[];
  payment_methods: string[];
  reservation_available: boolean;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  claim_status: ClaimStatus;
  creation_source?: CreationSource;
  is_featured: boolean;
  cover_image?: string;
  gallery_count?: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface AdminCreateBusinessInput {
  name: string;
  category: BusinessCategory;
  cuisine?: string;
  description?: string;
  short_description?: string;
  location_name?: string;
  neighborhood: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  price_range?: PriceRange;
  tags?: string[];
  payment_methods?: string[];
  reservation_available?: boolean;
  publication_status?: PublicationStatus;
  cover_media_id?: string;
}

export interface BusinessHours {
  id: string;
  business_id: number;
  day_of_week: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  opens_at?: string; // "HH:MM:SS"
  closes_at?: string; // "HH:MM:SS"
  is_closed: boolean;
}

export interface BusinessImage {
  id: string;
  business_id: number;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  business_id: number;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  business_id: number;
  name: string;
  description: string;
  price_etb_minor: number; // in santims (1 ETB = 100 santims)
  sort_order: number;
  is_available: boolean;
  image?: string;
  image_media_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CategoryWithItems {
  category: MenuCategory;
  items: MenuItem[];
}

export interface BusinessMenu {
  business_id: number;
  categories: CategoryWithItems[];
}

export interface BusinessUpdate {
  id: string;
  business_id: number;
  author_user_id: string;
  update_type: UpdateType;
  title: string;
  description: string;
  status: UpdateStatus;
  event_date?: string;
  event_time?: string;
  price_text?: string;
  offer_details?: string;
  valid_until?: string;
  expires_at?: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface ReviewSummary {
  business_id: number;
  count: number;
  average: number;
  distribution: [number, number, number, number, number];
}

export interface Review {
  id: string;
  business_id: number;
  customer_user_id: string;
  reservation_id: string;
  rating: number; // 1 to 5
  review_text: string;
  is_verified_visit: boolean;
  status: ReviewStatus;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Reservation {
  id: string;
  reservation_code: string;
  business_id: number;
  customer_user_id: string;
  customer_name: string;
  customer_phone: string;
  reservation_date: string; // "YYYY-MM-DD"
  reservation_time: string; // "HH:MM:SS" or "HH:MM"
  party_size: number;
  special_request?: string;
  status: ReservationStatus;
  decline_reason?: string;
  created_at: string;
  confirmed_at?: string;
  declined_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  reviewed_by_user?: string;
  updated_at: string;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_user_id: string;
  reason: ReviewReportReason;
  explanation: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessClaim {
  id: string;
  business_id: number;
  claimant_user_id: string;
  status: ClaimWorkflowStatus;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSubmission {
  id: string;
  submitter_user_id: string;
  business_name: string;
  category: BusinessCategory;
  area: string;
  submitted_payload?: Record<string, unknown>;
  status: SubmissionWorkflowStatus;
  created_business_id?: number;
  cover_media_id?: string;
  cover_image_url?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessReport {
  id: string;
  business_id: number;
  reporter_user_id: string;
  reason: BusinessReportReason;
  details?: string;
  status: ReportStatus;
  reviewed_at?: string;
  reviewed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PublicBusinessProfile {
  business: Business;
  hours: BusinessHours[];
  images: BusinessImage[];
  menu: BusinessMenu;
  active_updates: BusinessUpdate[];
  review_summary: ReviewSummary;
  recent_reviews: Review[];
}

export interface SearchResult {
  business: Business;
  rank: number;
}

export interface SavedBusinessItem {
  user_id: string;
  business_id: number;
  created_at: string;
}

export interface FollowedBusinessItem {
  user_id: string;
  business_id: number;
  created_at: string;
}

// Request & Response Envelope Types

export interface Pagination {
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  request_id?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// Authentication DTOs

export interface RequestOTPInput {
  phone: string;
}

export interface OTPRequestResult {
  challenge_id: string;
  expires_at: string;
  cooldown_seconds: number;
  dev_otp?: string;
}

export interface VerifyOTPInput {
  challenge_id: string;
  phone: string;
  otp_code: string;
}

export interface AuthResult {
  user: User;
  is_new_user: boolean;
}

export interface LogoutResult {
  logged_out: boolean;
}

export interface UpdateProfileInput {
  full_name: string;
  avatar_url?: string;
}

// Query Filters

export interface BusinessFilterParams {
  category?: BusinessCategory;
  neighborhood?: string;
  creation_source?: CreationSource;
  claim_status?: ClaimStatus;
  limit?: number;
  offset?: number;
}

export interface SearchParams {
  q: string;
  limit?: number;
  offset?: number;
}

// Reservation DTOs

export interface CreateReservationInput {
  business_id: number;
  party_size: number;
  reservation_date: string; // "YYYY-MM-DD"
  reservation_time: string; // "HH:MM" or "HH:MM:SS"
  customer_name?: string;
  customer_phone?: string;
  special_request?: string;
  special_requests?: string;
}

export interface ReservationFilterParams {
  [key: string]: string | number | boolean | null | undefined;
  limit?: number;
  offset?: number;
  status?: ReservationStatus;
  date?: string;
}

// Review DTOs

export interface CreateReviewInput {
  reservation_id: string;
  rating: number; // 1 to 5
  review_text: string;
  business_id?: number;
}

export interface UpdateReviewInput {
  rating: number;
  review_text: string;
}

export interface ReviewReportInput {
  reason: ReviewReportReason;
  explanation: string;
}

// Business Management & Ownership DTOs

export interface UpdateBusinessInput {
  name?: string;
  category?: BusinessCategory;
  cuisine?: string;
  description?: string;
  short_description?: string;
  phone?: string;
  website?: string;
  location_name?: string;
  neighborhood?: string;
  address_line?: string;
  latitude?: number;
  longitude?: number;
  price_range?: PriceRange;
  tags?: string[];
  payment_methods?: string[];
  reservation_available?: boolean;
}

export interface CreateClaimInput {
  business_id: number;
}

export interface CreateSubmissionInput {
  business_name: string;
  category: BusinessCategory;
  area: string;
  media_id?: string;
  payload?: Record<string, unknown>;
}

// Menu Management DTOs

export interface CreateMenuCategoryInput {
  name: string;
  sort_order: number;
}

export interface UpdateMenuCategoryInput {
  name?: string;
  sort_order?: number;
}

export interface ReorderCategoriesInput {
  category_ids: string[];
}

export interface CreateMenuItemInput {
  category_id: string;
  name: string;
  description?: string;
  price_etb_minor: number;
  is_available?: boolean;
  sort_order: number;
}

export interface UpdateMenuItemInput {
  category_id?: string;
  name?: string;
  description?: string;
  price_etb_minor?: number;
  is_available?: boolean;
  sort_order?: number;
}

export interface ReorderItemsInput {
  item_ids: string[];
}

// Business Updates Management DTOs

export interface CreateUpdateInput {
  update_type: UpdateType;
  title: string;
  description: string;
  event_date?: string;
  event_time?: string;
  price_text?: string;
  offer_details?: string;
  valid_until?: string;
  expires_at?: string;
}

export interface UpdateUpdateInput {
  update_type?: UpdateType;
  title?: string;
  description?: string;
  event_date?: string;
  event_time?: string;
  price_text?: string;
  offer_details?: string;
  valid_until?: string;
  expires_at?: string;
  status?: UpdateStatus;
}

// Platform Admin DTOs & Models

export interface AdminStats {
  pending_submissions: number;
  approved_submissions: number;
  rejected_submissions: number;
  total_submissions: number;
  pending_claims: number;
  approved_claims: number;
  rejected_claims: number;
  total_claims: number;
  pending_review_reports: number;
  resolved_review_reports: number;
  total_review_reports: number;
  pending_business_reports: number;
  resolved_business_reports: number;
  total_business_reports: number;
}

export interface AdminAction {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_entity_type: string;
  target_entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface RejectSubmissionInput {
  reason: string;
}

export interface ApproveClaimInput {
  notes?: string;
}

export interface RejectClaimInput {
  reason: string;
}

export interface ResolveReviewReportInput {
  status: ReportStatus; // DISMISSED or ACTIONED
  action?: string;
}

export interface ModerateReviewInput {
  status: ReviewStatus; // VISIBLE or REMOVED_BY_ADMIN
  reason: string;
}

export interface ResolveBusinessReportInput {
  status: ReportStatus; // DISMISSED or ACTIONED
  notes?: string;
}

export interface SetPublicationInput {
  status: PublicationStatus; // PUBLISHED or UNPUBLISHED
}

export interface SetVerificationInput {
  status: VerificationStatus; // VERIFIED or UNVERIFIED
}

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

// Media Domain & Tigris Upload Types
export type MediaType =
  | "BUSINESS_COVER"
  | "BUSINESS_GALLERY"
  | "MENU_ITEM"
  | "business_cover"
  | "business_gallery"
  | "menu_item";
export type MediaStatus = "PENDING" | "READY" | "FAILED" | "DELETED";
export type TargetType =
  | "submission"
  | "business_cover"
  | "business_gallery"
  | "menu_item";

export interface Media {
  id: string;
  created_by_user_id: string;
  business_id?: number;
  menu_item_id?: string;
  submission_id?: string;
  media_type: MediaType;
  object_key: string;
  content_type: string;
  file_size: number;
  status: MediaStatus;
  sort_order: number;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessMedia {
  cover: Media | null;
  gallery: Media[];
}

export interface PresignedUploadResponse {
  media_id: string;
  upload_url: string;
  object_key: string;
  expires_at: string;
}

export interface CompleteUploadResponse {
  media: Media;
}

export interface CreateUploadInput {
  target_type: TargetType;
  target_id?: string;
  media_type?: MediaType;
  content_type: string;
  file_size: number;
}

export interface ReorderMediaInput {
  media_ids: string[];
}



