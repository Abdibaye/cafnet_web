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

const emptyStorage: UpdateStorage = { updates: [] };

export function loadBusinessUpdates(): UpdateStorage {
  if (typeof window === "undefined") return emptyStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...emptyStorage, ...JSON.parse(stored) as UpdateStorage } : emptyStorage;
  } catch {
    return emptyStorage;
  }
}

export function saveBusinessUpdates(state: UpdateStorage) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
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
    
    if (update.validUntil && new Date(update.validUntil) < new Date(now)) {
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
    id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    publishedAt: now,
    status: "published",
  };

  const updatedState = {
    ...state,
    updates: [...state.updates, newUpdate],
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
  
  if (update.validUntil && new Date(update.validUntil) < new Date(now)) {
    return true;
  }
  
  return false;
}
