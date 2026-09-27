import { getBusinessById, type MockBusiness } from "./mockBusinesses";
import { getEditableData as getEditableDataFromStorage, type EditableBusinessData, type OpeningHours } from "./ownerManagedBusinessStorage";

export type MergedBusinessProfile = Omit<MockBusiness, "name" | "description" | "phone" | "location" | "category" | "priceRange" | "tags" | "openingHours"> & {
  name: string;
  description: string;
  phone: string;
  location: string;
  category: MockBusiness["category"];
  priceRange: string;
  tags: string[];
  openingHours: string | OpeningHours[];
  hasOwnerEdits: boolean;
};

function formatOpeningHoursForDisplay(hours: OpeningHours[]): string {
  if (!hours || hours.length === 0) return "";
  
  const openDays = hours.filter((h) => !h.isClosed);
  if (openDays.length === 0) return "Closed";
  
  if (openDays.length === hours.length) {
    const firstDay = openDays[0];
    const allSame = openDays.every((h) => h.open === firstDay.open && h.close === firstDay.close);
    if (allSame) {
      return `${firstDay.open} – ${firstDay.close}`;
    }
  }
  
  const daysGrouped: Record<string, { open: string; close: string }> = {};
  let currentGroup: { days: string[]; open: string; close: string } | null = null;
  
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  for (const day of daysOfWeek) {
    const hourData = hours.find((h) => h.day === day);
    if (!hourData || hourData.isClosed) continue;
    
    if (!currentGroup) {
      currentGroup = { days: [day], open: hourData.open, close: hourData.close };
    } else if (currentGroup.open === hourData.open && currentGroup.close === hourData.close) {
      currentGroup.days.push(day);
    } else {
      daysGrouped[currentGroup.days.join("-")] = { open: currentGroup.open, close: currentGroup.close };
      currentGroup = { days: [day], open: hourData.open, close: hourData.close };
    }
  }
  
  if (currentGroup) {
    daysGrouped[currentGroup.days.join("-")] = { open: currentGroup.open, close: currentGroup.close };
  }
  
  return Object.entries(daysGrouped)
    .map(([days, times]) => `${days}: ${times.open} – ${times.close}`)
    .join(", ");
}

export function getMergedBusinessProfile(businessId: string | number): MergedBusinessProfile | null {
  const seedBusiness = getBusinessById(businessId);
  if (!seedBusiness) return null;

  const editableData = getEditableDataFromStorage(Number(businessId));
  const hasOwnerEdits = !!editableData;

  if (!editableData) {
    return {
      ...seedBusiness,
      hasOwnerEdits: false,
    };
  }

  const merged: MergedBusinessProfile = {
    ...seedBusiness,
    name: editableData.name || seedBusiness.name,
    description: editableData.description || seedBusiness.description,
    phone: editableData.phone || seedBusiness.phone,
    location: editableData.location || seedBusiness.location,
    category: editableData.category || seedBusiness.category,
    priceRange: editableData.priceRange || seedBusiness.priceRange,
    tags: editableData.tags.length > 0 ? editableData.tags : seedBusiness.tags,
    openingHours: editableData.openingHours.length > 0 
      ? formatOpeningHoursForDisplay(editableData.openingHours)
      : seedBusiness.openingHours,
    hasOwnerEdits: true,
  };

  return merged;
}

export function getBusinessProfileData(businessId: string | number) {
  const merged = getMergedBusinessProfile(businessId);
  if (!merged) return null;
  
  const amenities = merged.tags.filter((tag) => ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag));
  const highlights = merged.tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);
  
  return {
    ...merged,
    address: `${merged.location}, Addis Ababa, Ethiopia`,
    amenities,
    highlights,
  };
}
