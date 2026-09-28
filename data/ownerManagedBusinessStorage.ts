import type { BusinessCategory } from "./mockBusinesses";

export type BusinessStatus = "managed" | "pending" | "unclaimed";

export type OpeningHours = {
  day: string;
  open: string;
  close: string;
  isClosed: boolean;
};

export type EditableBusinessData = {
  businessId: number;
  name: string;
  description: string;
  phone: string;
  location: string;
  category: BusinessCategory;
  priceRange: string;
  website: string;
  openingHours: OpeningHours[];
  tags: string[];
  updatedAt: string;
};

export type OwnerManagedBusiness = {
  id: string;
  businessId: number;
  status: BusinessStatus;
  editableData: EditableBusinessData;
  createdAt: string;
};

type OwnerManagedStorage = {
  managedBusinesses: OwnerManagedBusiness[];
};

const storageKey = "cafnet.mock-owner-managed-businesses";

const emptyStorage: OwnerManagedStorage = { managedBusinesses: [] };

const defaultOpeningHours: OpeningHours[] = [
  { day: "Monday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Tuesday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Wednesday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Thursday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Friday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Saturday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
  { day: "Sunday", open: "10:00 AM", close: "10:00 PM", isClosed: false },
];

export function loadOwnerManagedBusinesses(): OwnerManagedStorage {
  if (typeof window === "undefined") return emptyStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return emptyStorage;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return emptyStorage;
    return {
      managedBusinesses: Array.isArray(parsed.managedBusinesses)
        ? parsed.managedBusinesses.filter((b: unknown): b is OwnerManagedBusiness =>
            Boolean(b && typeof b === "object" && typeof (b as OwnerManagedBusiness).businessId === "number" && (b as OwnerManagedBusiness).editableData)
          )
        : [],
    };
  } catch {
    return emptyStorage;
  }
}

export function saveOwnerManagedBusinesses(state: OwnerManagedStorage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:managed-businesses-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function getManagedBusiness(businessId: number): OwnerManagedBusiness | undefined {
  const state = loadOwnerManagedBusinesses();
  return state.managedBusinesses.find((b) => b.businessId === businessId);
}

export function getEditableData(businessId: number): EditableBusinessData | undefined {
  const managedBusiness = getManagedBusiness(businessId);
  return managedBusiness?.editableData;
}

export function createManagedBusiness(businessId: number, seedData: Partial<EditableBusinessData>): OwnerManagedBusiness {
  const state = loadOwnerManagedBusinesses();
  const now = new Date().toISOString();
  
  const editableData: EditableBusinessData = {
    businessId,
    name: seedData.name || "",
    description: seedData.description || "",
    phone: seedData.phone || "",
    location: seedData.location || "",
    category: seedData.category || "restaurant",
    priceRange: seedData.priceRange || "",
    website: seedData.website || "",
    openingHours: seedData.openingHours || defaultOpeningHours,
    tags: seedData.tags || [],
    updatedAt: now,
  };

  const managedBusiness: OwnerManagedBusiness = {
    id: `managed-${Date.now()}-${businessId}`,
    businessId,
    status: "managed",
    editableData,
    createdAt: now,
  };

  const updatedState = {
    ...state,
    managedBusinesses: [...state.managedBusinesses.filter((b) => b.businessId !== businessId), managedBusiness],
  };

  saveOwnerManagedBusinesses(updatedState);
  return managedBusiness;
}

export function updateManagedBusiness(businessId: number, updates: Partial<EditableBusinessData>): OwnerManagedBusiness | undefined {
  const state = loadOwnerManagedBusinesses();
  const index = state.managedBusinesses.findIndex((b) => b.businessId === businessId);

  if (index === -1) return undefined;

  const updatedEditableData = {
    ...state.managedBusinesses[index].editableData,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  const updatedBusiness = {
    ...state.managedBusinesses[index],
    editableData: updatedEditableData,
  };

  const updatedState = {
    ...state,
    managedBusinesses: [
      ...state.managedBusinesses.slice(0, index),
      updatedBusiness,
      ...state.managedBusinesses.slice(index + 1),
    ],
  };

  saveOwnerManagedBusinesses(updatedState);
  return updatedBusiness;
}

export function deleteManagedBusiness(businessId: number): boolean {
  const state = loadOwnerManagedBusinesses();
  const filtered = state.managedBusinesses.filter((b) => b.businessId !== businessId);

  if (filtered.length === state.managedBusinesses.length) return false;

  saveOwnerManagedBusinesses({ ...state, managedBusinesses: filtered });
  return true;
}

export function hasUnsavedChanges(businessId: number, currentData: Partial<EditableBusinessData>): boolean {
  const managedBusiness = getManagedBusiness(businessId);
  if (!managedBusiness) return false;

  const savedData = managedBusiness.editableData;
  
  return (
    currentData.name !== savedData.name ||
    currentData.description !== savedData.description ||
    currentData.phone !== savedData.phone ||
    currentData.location !== savedData.location ||
    currentData.category !== savedData.category ||
    currentData.priceRange !== savedData.priceRange ||
    currentData.website !== savedData.website ||
    JSON.stringify(currentData.tags) !== JSON.stringify(savedData.tags) ||
    JSON.stringify(currentData.openingHours) !== JSON.stringify(savedData.openingHours)
  );
}

export const availableTags = [
  "Credit card accepted",
  "Wi-Fi available",
  "Live cultural show",
  "Parking available",
  "Family friendly",
  "Fasting menu",
  "Vegan options",
  "Outdoor seating",
  "Work-friendly",
  "Reservations recommended",
  "Daily fresh catch",
  "Non-alcoholic",
  "Takeaway",
  "Coffee ceremony",
  "Quiet corner",
  "Local favorite",
  "Rooftop",
  "Live DJ",
  "Single-origin beans",
  "Outdoor patio",
  "Cocktail lounge",
  "Italian",
  "Lunch favorite",
];

export const priceRangeOptions = ["$", "$$", "$$$", "$$$$"];

export const categoryOptions: { value: BusinessCategory; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "drinks", label: "Drinks & More" },
];
