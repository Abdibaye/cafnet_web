import type { BusinessCardItem } from "@/components/BusinessCard";
import type {
  Business,
  BusinessHours,
  BusinessImage,
  BusinessClaim as ApiBusinessClaim,
  BusinessSubmission as ApiBusinessSubmission,
  PublicBusinessProfile,
  ReviewSummary,
  Reservation,
  Review,
  BusinessUpdate,
  UpdateBusinessInput,
  PriceRange,
  BusinessMenu,
} from "./types";
import type { MockReservation } from "@/data/reservationStorage";
import type { CustomerReview } from "@/data/customerReviewStorage";
import type {
  OpeningHours,
  EditableBusinessData,
  OwnerManagedBusiness,
} from "@/data/ownerManagedBusinessStorage";
import type {
  BusinessClaim as UiBusinessClaim,
  BusinessSubmission as UiBusinessSubmission,
} from "@/data/businessOwnerStorage";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_IMAGES = [
  "/images/cafnet-placeholder.svg",
];

export function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  // If in HH:MM:SS or HH:MM format
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes} ${ampm}`;
  }
  return timeStr;
}

export function formatHours(hours: BusinessHours[]): string {
  if (!hours || hours.length === 0) return "Hours not available";

  const openDays = hours.filter((h) => !h.is_closed);
  if (openDays.length === 0) return "Closed";

  // If all open days have identical times
  const first = openDays[0];
  const allIdentical = openDays.every(
    (h) => h.opens_at === first.opens_at && h.closes_at === first.closes_at,
  );

  if (allIdentical && first.opens_at && first.closes_at) {
    const timeFormatted = `${formatTime(first.opens_at)} - ${formatTime(first.closes_at)}`;
    if (openDays.length === 7) {
      return `Daily: ${timeFormatted}`;
    }
    return `Mon – Sun: ${timeFormatted}`;
  }

  return openDays
    .map((h) => {
      const day = DAY_NAMES[h.day_of_week] || `Day ${h.day_of_week}`;
      return `${day}: ${formatTime(h.opens_at)} – ${formatTime(h.closes_at)}`;
    })
    .join(", ");
}

export function formatPriceEtb(minorSantims: number): string {
  if (minorSantims % 100 === 0) {
    return `${minorSantims / 100} ETB`;
  }
  return `${(minorSantims / 100).toFixed(2)} ETB`;
}

export function businessToCardItem(
  business: Business,
  reviewSummary?: ReviewSummary,
  imageUrl?: string,
): BusinessCardItem {
  const fallbackImage = "/images/cafnet-placeholder.svg";

  const image = imageUrl || business.cover_image || fallbackImage;
  const location = business.location_name || business.neighborhood || "";

  const tags =
    business.tags && Array.isArray(business.tags) && business.tags.length > 0
      ? business.tags
      : [];

  return {
    id: business.id,
    name: business.name,
    image,
    location,
    description: business.short_description || business.description || "",
    rating: reviewSummary?.average || 0,
    reviews: reviewSummary?.count || 0,
    tags,
  };
}

export interface AdaptedMenuCategory {
  category: string;
  items: {
    id?: string;
    name: string;
    price: string;
    description: string;
    image?: string;
  }[];
}

export interface AdaptedReview {
  id: number | string;
  user: string;
  rating: number;
  date: string;
  comment: string;
}

export interface AdaptedUpdate {
  type: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface BusinessProfileViewModel {
  id: number;
  name: string;
  category: "restaurant" | "cafe" | "drinks";
  cuisine: string;
  location: string;
  neighborhood: string;
  distance: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  description: string;
  shortDescription: string;
  images: string[];
  tags: string[];
  paymentMethods: string[];
  openingHours: string;
  phone: string;
  verified: boolean;
  reservationAvailable: boolean;
  claimStatus: "unclaimed" | "pending" | "claimed";
  featured: boolean;
  isOpen: boolean;
  menu: AdaptedMenuCategory[];
  updates: AdaptedUpdate[];
  reviews: AdaptedReview[];
  address: string;
  amenities: string[];
  highlights: string[];
  cover_image?: string;
  created_by_user_id?: string;
}

export function publicProfileToViewModel(
  profile: PublicBusinessProfile,
): BusinessProfileViewModel {
  const b = profile.business;
  const images =
    profile.images && profile.images.length > 0
      ? profile.images.map((img) => img.image_url)
      : b.cover_image
        ? [b.cover_image]
        : DEFAULT_IMAGES;

  const tags = b.tags && Array.isArray(b.tags) && b.tags.length > 0 ? b.tags : [];
  const location = b.location_name || b.neighborhood || "";
  const address = b.address_line
    ? `${b.address_line}, Addis Ababa, Ethiopia`
    : location
      ? `${location}, Addis Ababa, Ethiopia`
      : "";

  const amenities = tags.filter((tag) =>
    ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag),
  );
  const highlights = tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);

  const menu: AdaptedMenuCategory[] = (profile.menu?.categories || []).map((cat) => ({
    category: cat.category.name,
    items: (cat.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      price: formatPriceEtb(item.price_etb_minor),
      description: item.description,
      image: item.image,
    })),
  }));

  const updates: AdaptedUpdate[] = (profile.active_updates || []).map((u) => ({
    type: u.update_type.replace(/_/g, " "),
    title: u.title,
    description: u.description,
    createdAt: new Date(u.published_at || u.created_at).toLocaleDateString(),
  }));

  const reviews: AdaptedReview[] = (profile.recent_reviews || []).map((r, idx) => ({
    id: r.id || idx + 1,
    user: "Verified Guest",
    rating: r.rating,
    date: new Date(r.created_at).toLocaleDateString(),
    comment: r.review_text,
  }));

  const claimStatus =
    b.claim_status === "CLAIMED"
      ? ("claimed" as const)
      : ("unclaimed" as const);

  return {
    id: b.id,
    name: b.name,
    category: b.category,
    cuisine: b.cuisine || "",
    location,
    neighborhood: b.neighborhood || "",
    distance: "",
    rating: profile.review_summary?.average || 0,
    reviewCount: profile.review_summary?.count || reviews.length || 0,
    priceRange: b.price_range || "",
    description: b.description || "",
    shortDescription: b.short_description || b.description || "",
    images,
    tags,
    paymentMethods: Array.isArray(b.payment_methods) && b.payment_methods.length > 0 ? b.payment_methods : [],
    openingHours: formatHours(profile.hours),
    phone: b.phone || "",
    verified: b.verification_status === "VERIFIED",
    reservationAvailable: b.reservation_available,
    claimStatus,
    featured: b.is_featured,
    isOpen: true,
    menu,
    updates,
    reviews,
    address,
    amenities,
    highlights,
    cover_image: b.cover_image,
    created_by_user_id: b.created_by_user_id,
  };
}

export function businessToViewModel(
  business: Business,
  hours: BusinessHours[] = [],
  images: BusinessImage[] = [],
): BusinessProfileViewModel {
  const imgUrls =
    images && images.length > 0
      ? images.map((img) => img.image_url)
      : business.cover_image
        ? [business.cover_image]
        : DEFAULT_IMAGES;

  const tags =
    business.tags && Array.isArray(business.tags) && business.tags.length > 0
      ? business.tags
      : [];
  const location = business.location_name || business.neighborhood || "";
  const address = business.address_line
    ? `${business.address_line}, Addis Ababa, Ethiopia`
    : location
      ? `${location}, Addis Ababa, Ethiopia`
      : "";

  const amenities = tags.filter((tag) =>
    ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag),
  );
  const highlights = tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);

  const claimStatus =
    business.claim_status === "CLAIMED"
      ? ("claimed" as const)
      : ("unclaimed" as const);

  return {
    id: business.id,
    name: business.name,
    category: business.category,
    cuisine: business.cuisine || "",
    location,
    neighborhood: business.neighborhood || "",
    distance: "",
    rating: 0,
    reviewCount: 0,
    priceRange: business.price_range || "",
    description: business.description || "",
    shortDescription: business.short_description || business.description || "",
    images: imgUrls,
    tags,
    paymentMethods:
      Array.isArray(business.payment_methods) && business.payment_methods.length > 0
        ? business.payment_methods
        : [],
    openingHours: formatHours(hours),
    phone: business.phone || "",
    verified: business.verification_status === "VERIFIED",
    reservationAvailable: business.reservation_available,
    claimStatus,
    featured: business.is_featured,
    isOpen: true,
    menu: [],
    updates: [],
    reviews: [],
    address,
    amenities,
    highlights,
    cover_image: business.cover_image,
    created_by_user_id: business.created_by_user_id,
  };
}

export function formatReservationTimeForApi(timeStr: string): string {
  if (!timeStr) return "19:00:00";
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return timeStr;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[4]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  const hh = hours.toString().padStart(2, "0");
  return `${hh}:${minutes}:00`;
}

export type UiReservationStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";
export type BusinessReservationViewModel = MockReservation;

export function reservationToViewModel(r: Reservation): BusinessReservationViewModel {
  const dateStr = typeof r.reservation_date === "string" ? r.reservation_date.slice(0, 10) : "";
  const statusStr = (r.status ? r.status.toLowerCase() : "pending") as BusinessReservationViewModel["status"];

  return {
    id: r.id,
    businessId: r.business_id,
    customerId: r.customer_user_id,
    customerName: r.customer_name || "Guest",
    customerPhone: r.customer_phone || "",
    date: dateStr,
    time: formatTime(r.reservation_time),
    partySize: r.party_size,
    specialRequest: r.special_request || "",
    status: statusStr,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
    declinedAt: r.declined_at,
    declineReason: r.decline_reason,
    completedAt: r.completed_at,
    cancelledAt: r.cancelled_at,
    reviewedBy: r.reviewed_by_user,
  };
}

export function reviewToViewModel(
  r: Review,
  authorName = "Verified Guest",
  authorAvatar?: string,
): CustomerReview {
  const avatar = authorAvatar || authorName.charAt(0).toUpperCase() || "V";
  const dateFormatted = r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  return {
    id: r.id,
    businessId: r.business_id,
    userId: r.customer_user_id,
    userName: authorName,
    userAvatar: avatar,
    rating: r.rating,
    text: r.review_text,
    date: dateFormatted,
    helpfulCount: r.helpful_count || 0,
    verifiedVisit: r.is_verified_visit,
    customerId: r.customer_user_id,
    reservationId: r.reservation_id,
    createdAt: r.created_at,
    helpfulByCustomer: [],
  };
}

export function reviewSummaryToDistribution(
  summary: ReviewSummary,
): { count: number; average: number; distribution: number[] } {
  return {
    count: summary.count,
    average: summary.average,
    distribution: [...summary.distribution],
  };
}

export type UpdateType = "new_menu" | "offer" | "event" | "price_update" | "announcement";

export interface BusinessUpdateViewModel {
  id: string;
  businessId: number;
  type: UpdateType;
  title: string;
  description: string;
  createdAt: string;
  publishedAt: string;
  expiresAt?: string;
  eventDate?: string;
  eventTime?: string;
  price?: string;
  offerDetails?: string;
  validUntil?: string;
  status: "draft" | "published" | "expired";
}

export function getUpdateTypeLabel(type: UpdateType): string {
  const labels: Record<UpdateType, string> = {
    new_menu: "New Menu",
    offer: "Offer",
    event: "Event",
    price_update: "Price Update",
    announcement: "Announcement",
  };
  return labels[type] || type;
}

export function getUpdateTypeIcon(type: UpdateType): string {
  const icons: Record<UpdateType, string> = {
    new_menu: "restaurant_menu",
    offer: "local_offer",
    event: "event",
    price_update: "price_change",
    announcement: "campaign",
  };
  return icons[type] || "info";
}

export const updateTypeOptions: { value: UpdateType; label: string; icon: string }[] = [
  { value: "new_menu", label: "New Menu", icon: "restaurant_menu" },
  { value: "offer", label: "Offer", icon: "local_offer" },
  { value: "event", label: "Event", icon: "event" },
  { value: "price_update", label: "Price Update", icon: "price_change" },
  { value: "announcement", label: "Announcement", icon: "campaign" },
];

export function formatUpdateDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) {
    return "Just now";
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else if (diffInHours < 72) {
    return "2 days ago";
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export function isUpdateExpired(update: BusinessUpdate | BusinessUpdateViewModel): boolean {
  if ("status" in update && update.status) {
    const s = String(update.status).toLowerCase();
    if (s === "expired") return true;
    if (s !== "published") return false;
  }

  const now = new Date().toISOString();
  const expAt = "expires_at" in update ? (update as BusinessUpdate).expires_at : (update as BusinessUpdateViewModel).expiresAt;
  if (expAt && new Date(expAt) <= new Date(now)) {
    return true;
  }

  const validUntil = "valid_until" in update ? (update as BusinessUpdate).valid_until : (update as BusinessUpdateViewModel).validUntil;
  if (validUntil && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(validUntil)) {
    const endOfDay = new Date(`${validUntil}T23:59:59.999Z`);
    if (endOfDay <= new Date(now)) {
      return true;
    }
  }

  return false;
}

export function apiUpdateToStorageUpdate(
  u: BusinessUpdate,
): BusinessUpdateViewModel {
  let mappedType: UpdateType = "announcement";
  const rawType = (u.update_type || "").toLowerCase();
  if (rawType === "event") mappedType = "event";
  else if (rawType === "offer") mappedType = "offer";
  else if (rawType === "new_menu") mappedType = "new_menu";
  else if (rawType === "price_update") mappedType = "price_update";
  else mappedType = "announcement";

  let mappedStatus: "draft" | "published" | "expired" = "published";
  const rawStatus = (u.status || "").toLowerCase();
  if (rawStatus === "draft") mappedStatus = "draft";
  else if (rawStatus === "expired") mappedStatus = "expired";
  else mappedStatus = "published";

  return {
    id: u.id,
    businessId: u.business_id,
    type: mappedType,
    title: u.title,
    description: u.description,
    createdAt: u.created_at,
    publishedAt: u.published_at || u.created_at,
    expiresAt: u.expires_at,
    eventDate: u.event_date,
    eventTime: u.event_time,
    price: u.price_text,
    offerDetails: u.offer_details,
    validUntil: u.valid_until,
    status: mappedStatus,
  };
}

export const apiUpdateToViewModel = apiUpdateToStorageUpdate;

// ==========================================
// Business Center Adapters (Backend 13)
// ==========================================

const UI_DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const DAY_NAME_TO_INT: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

/**
 * Converts backend BusinessHours[] to frontend OpeningHours[].
 */
export function businessHoursToOpeningHours(hours: BusinessHours[] = []): OpeningHours[] {
  return UI_DAYS_OF_WEEK.map((dayName) => {
    const dayInt = DAY_NAME_TO_INT[dayName];
    const match = hours.find((h) => h.day_of_week === dayInt);
    if (!match) {
      return {
        day: dayName,
        open: "10:00 AM",
        close: "10:00 PM",
        isClosed: false,
      };
    }
    return {
      day: dayName,
      open: match.opens_at ? formatTime(match.opens_at) : "10:00 AM",
      close: match.closes_at ? formatTime(match.closes_at) : "10:00 PM",
      isClosed: match.is_closed,
    };
  });
}

/**
 * Converts 12-hour AM/PM string ("10:00 AM" or "10:00:00") to 24-hour "HH:MM:SS" format.
 */
export function timeStringTo24Hour(timeStr?: string): string | undefined {
  if (!timeStr) return undefined;
  const trimmed = timeStr.trim();
  if (!trimmed) return undefined;
  // Already in HH:MM:SS or HH:MM format without AM/PM
  if (!trimmed.toLowerCase().includes("am") && !trimmed.toLowerCase().includes("pm")) {
    const parts = trimmed.split(":");
    const h = parts[0].padStart(2, "0");
    const m = (parts[1] || "00").padStart(2, "0");
    const s = (parts[2] || "00").padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  return formatReservationTimeForApi(trimmed);
}

/**
 * Converts frontend OpeningHours[] to backend BusinessHours[].
 */
export function openingHoursToBusinessHours(
  openingHours: OpeningHours[],
  businessId: number,
): BusinessHours[] {
  return openingHours.map((oh) => {
    const dayOfWeek = DAY_NAME_TO_INT[oh.day] ?? 1;
    return {
      id: "",
      business_id: businessId,
      day_of_week: dayOfWeek,
      opens_at: oh.isClosed ? undefined : timeStringTo24Hour(oh.open),
      closes_at: oh.isClosed ? undefined : timeStringTo24Hour(oh.close),
      is_closed: Boolean(oh.isClosed),
    };
  });
}

/**
 * Converts a backend Business (+ optional hours) into frontend EditableBusinessData.
 */
export function businessToEditableData(
  business: Business,
  hours: BusinessHours[] = [],
): EditableBusinessData {
  return {
    businessId: business.id,
    name: business.name,
    description: business.description || "",
    phone: business.phone || "",
    location: business.location_name || business.neighborhood || "",
    category: business.category,
    priceRange: business.price_range || "$$",
    website: business.website || "",
    openingHours: businessHoursToOpeningHours(hours),
    tags: business.tags || [],
    updatedAt: business.updated_at || new Date().toISOString(),
  };
}

/**
 * Converts frontend EditableBusinessData into backend UpdateBusinessInput.
 */
export function editableDataToUpdateInput(
  data: Partial<EditableBusinessData>,
): UpdateBusinessInput {
  const result: UpdateBusinessInput = {};
  if (data.name !== undefined) result.name = data.name.trim();
  if (data.category !== undefined) result.category = data.category;
  if (data.description !== undefined) result.description = data.description.trim();
  if (data.phone !== undefined) result.phone = data.phone.trim();
  if (data.location !== undefined) {
    result.location_name = data.location.trim();
    result.neighborhood = data.location.trim();
  }
  if (data.priceRange !== undefined && data.priceRange !== "") {
    result.price_range = data.priceRange as PriceRange;
  }
  if (data.website !== undefined) result.website = data.website.trim();
  if (data.tags !== undefined) result.tags = data.tags;
  return result;
}

/**
 * Converts backend BusinessClaim to UI BusinessClaim model.
 */
export function apiClaimToViewModel(claim: ApiBusinessClaim): UiBusinessClaim {
  return {
    id: claim.id,
    businessId: claim.business_id,
    status: claim.status.toLowerCase() as "pending" | "approved" | "rejected",
    submittedAt: claim.submitted_at,
    reviewedAt: claim.reviewed_at,
    rejectionReason: claim.rejection_reason,
  };
}

/**
 * Converts backend BusinessSubmission to UI BusinessSubmission model.
 */
export function apiSubmissionToViewModel(
  sub: ApiBusinessSubmission,
): UiBusinessSubmission {
  return {
    id: sub.id,
    businessName: sub.business_name,
    category: sub.category,
    area: sub.area,
    phone: (sub.submitted_payload?.phone as string) || undefined,
    cover_image_url: sub.cover_image_url,
    status: sub.status.toLowerCase() as "pending" | "approved" | "rejected",
    submittedAt: sub.submitted_at,
    reviewedAt: sub.reviewed_at,
    rejectionReason: sub.rejection_reason,
    createdBusinessId: sub.created_business_id,
  };
}

/**
 * Converts backend Business to OwnerManagedBusiness model.
 */
export function businessToOwnerManaged(
  business: Business,
  hours: BusinessHours[] = [],
): OwnerManagedBusiness {
  return {
    id: `mb-${business.id}`,
    businessId: business.id,
    status: "managed",
    editableData: businessToEditableData(business, hours),
    createdAt: business.created_at || new Date().toISOString(),
  };
}

// ==========================================
// Menu Management ViewModels & Helpers
// ==========================================

export interface MenuItemViewModel {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: string;
  priceEtbMinor: number;
  isAvailable: boolean;
  sortOrder: number;
  image?: string;
  imageMediaId?: string;
}

export interface MenuCategoryViewModel {
  id: string;
  name: string;
  sortOrder: number;
  items: MenuItemViewModel[];
}

export interface BusinessMenuViewModel {
  businessId: number;
  categories: MenuCategoryViewModel[];
}

export interface MenuSummaryViewModel {
  categoryCount: number;
  itemCount: number;
  hasMenu: boolean;
}

/**
 * Parses a price string or number into canonical integer minor units (Santims).
 * 1 ETB = 100 Santims.
 * Handles inputs like "125", "125 ETB", "125.50", "125.50 ETB", 125, 125.5.
 * Throws an Error if invalid or negative.
 */
export function parsePriceToMinorSantims(price: string | number): number {
  if (typeof price === "number") {
    if (isNaN(price) || !isFinite(price) || price < 0) {
      throw new Error("Invalid price value");
    }
    return Math.round(price * 100);
  }

  if (typeof price !== "string") {
    throw new Error("Price must be a string or number");
  }

  const sanitized = price.replace(/etb/gi, "").replace(/,/g, "").trim();
  if (!sanitized) {
    throw new Error("Price cannot be empty");
  }

  const num = Number(sanitized);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    throw new Error("Invalid price number format");
  }

  return Math.round(num * 100);
}

/**
 * Converts a backend BusinessMenu entity to the frontend UI view model.
 */
export function apiMenuToViewModel(menu: BusinessMenu): BusinessMenuViewModel {
  return {
    businessId: menu.business_id,
    categories: (menu.categories || []).map((catWithItems) => ({
      id: catWithItems.category.id,
      name: catWithItems.category.name,
      sortOrder: catWithItems.category.sort_order,
      items: (catWithItems.items || []).map((item) => ({
        id: item.id,
        categoryId: item.category_id,
        name: item.name,
        description: item.description || "",
        price: formatPriceEtb(item.price_etb_minor),
        priceEtbMinor: item.price_etb_minor,
        isAvailable: item.is_available,
        sortOrder: item.sort_order,
        image: item.image,
        imageMediaId: item.image_media_id,
      })),
    })),
  };
}

/**
 * Computes menu summary counts (categories and items) from API or ViewModel menu.
 */
export function computeMenuSummary(
  menu: BusinessMenu | BusinessMenuViewModel | null | undefined,
): MenuSummaryViewModel {
  if (!menu || !menu.categories || menu.categories.length === 0) {
    return { categoryCount: 0, itemCount: 0, hasMenu: false };
  }

  const categoryCount = menu.categories.length;
  let itemCount = 0;
  for (const cat of menu.categories) {
    if ("items" in cat && Array.isArray(cat.items)) {
      itemCount += cat.items.length;
    }
  }

  return {
    categoryCount,
    itemCount,
    hasMenu: categoryCount > 0,
  };
}


