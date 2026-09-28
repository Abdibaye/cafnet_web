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

export function loadBusinessOwnerState(): OwnerStorage {
  if (typeof window === "undefined") return emptyStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return emptyStorage;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return emptyStorage;

    return {
      claims: Array.isArray(parsed.claims)
        ? parsed.claims.filter((c: unknown): c is BusinessClaim =>
            Boolean(c && typeof c === "object" && typeof (c as BusinessClaim).id === "string" && typeof (c as BusinessClaim).businessId === "number")
          )
        : [],
      submissions: Array.isArray(parsed.submissions)
        ? parsed.submissions.filter((s: unknown): s is BusinessSubmission =>
            Boolean(s && typeof s === "object" && typeof (s as BusinessSubmission).id === "string" && typeof (s as BusinessSubmission).businessName === "string")
          )
        : [],
    };
  } catch {
    return emptyStorage;
  }
}

export function saveBusinessOwnerState(state: OwnerStorage) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:business-owner-updated"));
  } catch {
    // Ignore storage write failures
  }
}