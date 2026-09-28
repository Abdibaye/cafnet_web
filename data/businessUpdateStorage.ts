export type UpdateType = "new_menu" | "offer" | "event" | "price_update" | "announcement";

export type BusinessUpdate = {
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
};

type UpdateStorage = {
  updates: BusinessUpdate[];
};

const storageKey = "cafnet.mock-business-updates";

export const defaultSeedUpdates: BusinessUpdate[] = [
  {
    id: "update-seed-1",
    businessId: 1,
    type: "event",
    title: "Live Cultural Show & Dinner",
    description: "Experience authentic Ethiopian live music and traditional dance performances every Friday and Saturday evening from 7:30 PM.",
    createdAt: "2026-09-20T10:00:00.000Z",
    publishedAt: "2026-09-20T10:00:00.000Z",
    eventDate: "Every Friday & Saturday",
    eventTime: "7:30 PM",
    status: "published",
  },
  {
    id: "update-seed-2",
    businessId: 2,
    type: "new_menu",
    title: "Single-Origin Guji Roast Now Available",
    description: "Try our freshly roasted Guji beans with notes of wild berries and jasmine honey. Available in-store and whole beans to go.",
    createdAt: "2026-09-22T08:30:00.000Z",
    publishedAt: "2026-09-22T08:30:00.000Z",
    price: "180 ETB",
    status: "published",
  },
  {
    id: "update-seed-4",
    businessId: 4,
    type: "offer",
    title: "Weekend Lakeside Lunch Special",
    description: "Enjoy 15% off our signature fresh fish platter when dining on the lakefront patio between 12:00 PM and 3:00 PM.",
    createdAt: "2026-09-24T12:00:00.000Z",
    publishedAt: "2026-09-24T12:00:00.000Z",
    offerDetails: "15% off lunch platters",
    validUntil: "Weekend afternoons",
    status: "published",
  },
];

const emptyStorage: UpdateStorage = { updates: defaultSeedUpdates };

export function loadBusinessUpdates(): UpdateStorage {
  if (typeof window === "undefined") return { updates: defaultSeedUpdates };
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return { updates: defaultSeedUpdates };
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.updates)) {
      return { updates: defaultSeedUpdates };
    }
    const sanitizedUpdates = parsed.updates.filter((u: unknown): u is BusinessUpdate =>
      Boolean(
        u &&
        typeof u === "object" &&
        typeof (u as BusinessUpdate).id === "string" &&
        typeof (u as BusinessUpdate).businessId === "number" &&
        typeof (u as BusinessUpdate).title === "string" &&
        ((u as BusinessUpdate).status === "published" || (u as BusinessUpdate).status === "draft" || (u as BusinessUpdate).status === "expired")
      )
    );
    return { updates: sanitizedUpdates };
  } catch {
    return { updates: defaultSeedUpdates };
  }
}

export function saveBusinessUpdates(state: UpdateStorage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:updates-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function getUpdatesByBusiness(businessId: number): BusinessUpdate[] {
  const state = loadBusinessUpdates();
  return state.updates.filter((update) => update.businessId === businessId);
}

export function getUpdateById(updateId: string): BusinessUpdate | undefined {
  const state = loadBusinessUpdates();
  return state.updates.find((update) => update.id === updateId);
}

export function getAllUpdates(): BusinessUpdate[] {
  const state = loadBusinessUpdates();
  return state.updates;
}

export function getActiveUpdates(): BusinessUpdate[] {
  const allUpdates = getAllUpdates();
  const now = new Date().toISOString();

  return allUpdates.filter((update) => {
    if (update.status !== "published") return false;

    if (update.expiresAt && new Date(update.expiresAt) < new Date(now)) {
      return false;
    }

    if (update.validUntil && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(update.validUntil) && new Date(update.validUntil) < new Date(now)) {
      return false;
    }

    return true;
  });
}

export function getUpdatesByBusinessIds(businessIds: number[]): BusinessUpdate[] {
  const allUpdates = getAllUpdates();
  return allUpdates.filter((update) => businessIds.includes(update.businessId));
}

export function createUpdate(update: Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status">): BusinessUpdate {
  const state = loadBusinessUpdates();
  const now = new Date().toISOString();

  const newUpdate: BusinessUpdate = {
    ...update,
    id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
    publishedAt: now,
    status: "published",
  };

  const updatedState = {
    ...state,
    updates: [newUpdate, ...state.updates],
  };

  saveBusinessUpdates(updatedState);
  return newUpdate;
}

export function updateUpdate(updateId: string, updates: Partial<BusinessUpdate>): BusinessUpdate | undefined {
  const state = loadBusinessUpdates();
  const index = state.updates.findIndex((update) => update.id === updateId);

  if (index === -1) return undefined;

  const updatedUpdate = {
    ...state.updates[index],
    ...updates,
    publishedAt: new Date().toISOString(),
  };

  const updatedState = {
    ...state,
    updates: [
      ...state.updates.slice(0, index),
      updatedUpdate,
      ...state.updates.slice(index + 1),
    ],
  };

  saveBusinessUpdates(updatedState);
  return updatedUpdate;
}

export function deleteUpdate(updateId: string): boolean {
  const state = loadBusinessUpdates();
  const filtered = state.updates.filter((update) => update.id !== updateId);

  if (filtered.length === state.updates.length) return false;

  saveBusinessUpdates({ ...state, updates: filtered });
  return true;
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

export function isUpdateExpired(update: BusinessUpdate): boolean {
  if (update.status !== "published") return false;

  const now = new Date().toISOString();

  if (update.expiresAt && new Date(update.expiresAt) < new Date(now)) {
    return true;
  }

  if (update.validUntil && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(update.validUntil) && new Date(update.validUntil) < new Date(now)) {
    return true;
  }

  return false;
}
