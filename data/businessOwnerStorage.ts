export type BusinessClaim = {
  id: string;
  businessId: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
};

export type BusinessSubmission = {
  id: string;
  businessName: string;
  category: "restaurant" | "cafe" | "drinks";
  area: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdBusinessId?: number;
};

export type OwnerStorage = {
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
};

const storageKey = "cafnet.mock-business-owner";

const emptyStorage: OwnerStorage = { claims: [], submissions: [] };
const memoryFallbackStorage: OwnerStorage = { claims: [], submissions: [] };

export function loadBusinessOwnerState(): OwnerStorage {
  if (typeof window === "undefined") return memoryFallbackStorage;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return emptyStorage;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return emptyStorage;

    return {
      claims: Array.isArray(parsed.claims)
        ? parsed.claims.filter((c: unknown): c is BusinessClaim =>
            Boolean(
              c &&
              typeof c === "object" &&
              typeof (c as BusinessClaim).id === "string" &&
              typeof (c as BusinessClaim).businessId === "number" &&
              ((c as BusinessClaim).status === "pending" ||
                (c as BusinessClaim).status === "approved" ||
                (c as BusinessClaim).status === "rejected")
            )
          )
        : [],
      submissions: Array.isArray(parsed.submissions)
        ? parsed.submissions.filter((s: unknown): s is BusinessSubmission =>
            Boolean(
              s &&
              typeof s === "object" &&
              typeof (s as BusinessSubmission).id === "string" &&
              typeof (s as BusinessSubmission).businessName === "string" &&
              ((s as BusinessSubmission).status === "pending" ||
                (s as BusinessSubmission).status === "approved" ||
                (s as BusinessSubmission).status === "rejected")
            )
          )
        : [],
    };
  } catch {
    return emptyStorage;
  }
}

export function saveBusinessOwnerState(state: OwnerStorage) {
  if (typeof window === "undefined") {
    memoryFallbackStorage.claims = [...state.claims];
    memoryFallbackStorage.submissions = [...state.submissions];
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:business-owner-updated"));
  } catch {
    // Ignore storage write failures
  }
}