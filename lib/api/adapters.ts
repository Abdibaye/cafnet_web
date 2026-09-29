import type { BusinessCardItem } from "@/components/BusinessCard";
import type {
  Business,
  BusinessHours,
  PublicBusinessProfile,
  ReviewSummary,
  Reservation,
  Review,
} from "./types";
import type { MockReservation } from "@/data/reservationStorage";
import type { CustomerReview } from "@/data/customerReviewStorage";

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
  "/images/placeholder1.jpeg",
  "/images/placeholder2.jpeg",
  "/images/placeholder3.jpeg",
  "/images/placeholder4.jpeg",
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
  const fallbackImage =
    business.category === "cafe"
      ? "/images/cafe/placeholder1.webp"
      : business.category === "drinks"
        ? "/images/pizza.jpg"
        : "/images/placeholder1.jpeg";

  const image = imageUrl || fallbackImage;
  const location = business.location_name
    ? `${business.location_name}, 350m`
    : `${business.neighborhood || "Addis Ababa"}, 350m`;

  const tags =
    business.tags && business.tags.length > 0
      ? business.tags
      : [business.cuisine || "Local dining", "Verified"];

  return {
    id: business.id,
    name: business.name,
    image,
    location,
    description: business.short_description || business.description,
    rating: reviewSummary?.average || 4.8,
    reviews: reviewSummary?.count || 120,
    tags,
  };
}

export interface AdaptedMenuCategory {
  category: string;
  items: {
    name: string;
    price: string;
    description: string;
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
}

export function publicProfileToViewModel(
  profile: PublicBusinessProfile,
): BusinessProfileViewModel {
  const b = profile.business;
  const images =
    profile.images && profile.images.length > 0
      ? profile.images.map((img) => img.image_url)
      : DEFAULT_IMAGES;

  const tags = b.tags && b.tags.length > 0 ? b.tags : [b.cuisine || "Ethiopian"];
  const location = b.location_name || b.neighborhood || "Bole";
  const address = b.address_line
    ? `${b.address_line}, Addis Ababa, Ethiopia`
    : `${location}, Addis Ababa, Ethiopia`;

  const amenities = tags.filter((tag) =>
    ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag),
  );
  const highlights = tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);

  const menu: AdaptedMenuCategory[] = (profile.menu?.categories || []).map((cat) => ({
    category: cat.category.name,
    items: (cat.items || []).map((item) => ({
      name: item.name,
      price: formatPriceEtb(item.price_etb_minor),
      description: item.description,
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
    cuisine: b.cuisine || "Ethiopian",
    location,
    neighborhood: b.neighborhood || "Bole",
    distance: "350m",
    rating: profile.review_summary?.average || 4.8,
    reviewCount: profile.review_summary?.count || (reviews.length ? reviews.length : 124),
    priceRange: b.price_range || "$$",
    description: b.description,
    shortDescription: b.short_description || b.description,
    images,
    tags,
    paymentMethods: b.payment_methods?.length > 0 ? b.payment_methods : ["Cash", "Telebirr"],
    openingHours: formatHours(profile.hours),
    phone: b.phone,
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

export function reservationToViewModel(r: Reservation): MockReservation {
  const dateStr = typeof r.reservation_date === "string" ? r.reservation_date.slice(0, 10) : "";
  const statusStr = (r.status ? r.status.toLowerCase() : "pending") as MockReservation["status"];

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
