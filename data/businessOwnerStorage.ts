export type BusinessClaim = {
  id: string;
  businessId: number;
  status: "pending";
  submittedAt: string;
};

export type BusinessSubmission = {
  id: string;
  businessName: string;
  category: "restaurant" | "cafe" | "drinks";
  area: string;
  status: "pending";
  submittedAt: string;
};

type OwnerStorage = {
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
};

const storageKey = "cafnet.mock-business-owner";

const emptyStorage: OwnerStorage = { claims: [], submissions: [] };

export function loadBusinessOwnerState() {
  if (typeof window === "undefined") return emptyStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? { ...emptyStorage, ...JSON.parse(stored) as OwnerStorage } : emptyStorage;
  } catch {
    return emptyStorage;
  }
}

export function saveBusinessOwnerState(state: OwnerStorage) {
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}