import {
  loadBusinessOwnerState,
  saveBusinessOwnerState,
  type BusinessClaim,
  type BusinessSubmission,
} from "./businessOwnerStorage";
import {
  createManagedBusiness,
  getManagedBusiness,
  loadOwnerManagedBusinesses,
} from "./ownerManagedBusinessStorage";
import { mockBusinesses, type MockBusiness } from "./mockBusinesses";

export type AdminState = {
  verifiedOverrides: Record<number, boolean>;
  publishedBusinesses: MockBusiness[];
};

const adminAuthKey = "cafnet.mock-admin-auth";
const adminStateKey = "cafnet.mock-admin-state";

const emptyAdminState: AdminState = {
  verifiedOverrides: {},
  publishedBusinesses: [],
};

const memoryAdminState: AdminState = {
  verifiedOverrides: {},
  publishedBusinesses: [],
};

let memoryAdminAuth = false;

// -------------------------------------------------------------
// Admin Authentication (Mock Gate)
// -------------------------------------------------------------

export function isAdminAuthenticated(): boolean {
  if (typeof window === "undefined") return memoryAdminAuth;
  try {
    return window.localStorage.getItem(adminAuthKey) === "true";
  } catch {
    return false;
  }
}

export function loginAdmin(): void {
  if (typeof window === "undefined") {
    memoryAdminAuth = true;
    return;
  }
  try {
    window.localStorage.setItem(adminAuthKey, "true");
    window.dispatchEvent(new CustomEvent("cafnet:admin-auth-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function logoutAdmin(): void {
  if (typeof window === "undefined") {
    memoryAdminAuth = false;
    return;
  }
  try {
    window.localStorage.removeItem(adminAuthKey);
    window.dispatchEvent(new CustomEvent("cafnet:admin-auth-updated"));
  } catch {
    // Ignore storage write failures
  }
}

// -------------------------------------------------------------
// Admin Storage
// -------------------------------------------------------------

export function loadAdminState(): AdminState {
  if (typeof window === "undefined") return memoryAdminState;
  try {
    const stored = window.localStorage.getItem(adminStateKey);
    if (!stored) return emptyAdminState;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return emptyAdminState;

    return {
      verifiedOverrides:
        parsed.verifiedOverrides && typeof parsed.verifiedOverrides === "object"
          ? parsed.verifiedOverrides
          : {},
      publishedBusinesses: Array.isArray(parsed.publishedBusinesses)
        ? parsed.publishedBusinesses
        : [],
    };
  } catch {
    return emptyAdminState;
  }
}

export function saveAdminState(state: AdminState) {
  if (typeof window === "undefined") {
    memoryAdminState.verifiedOverrides = { ...state.verifiedOverrides };
    memoryAdminState.publishedBusinesses = [...state.publishedBusinesses];
    return;
  }
  try {
    window.localStorage.setItem(adminStateKey, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("cafnet:admin-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function getAdminPublishedBusinesses(): MockBusiness[] {
  const state = loadAdminState();
  return state.publishedBusinesses;
}

export function getBusinessVerificationOverride(businessId: number): boolean | undefined {
  const state = loadAdminState();
  return state.verifiedOverrides[businessId];
}

export function setBusinessVerification(businessId: number, verified: boolean): void {
  const state = loadAdminState();
  const updatedState: AdminState = {
    ...state,
    verifiedOverrides: {
      ...state.verifiedOverrides,
      [businessId]: verified,
    },
  };
  saveAdminState(updatedState);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cafnet:managed-businesses-updated"));
  }
}

// -------------------------------------------------------------
// Claim Actions
// -------------------------------------------------------------

export function approveClaim(claimId: string): boolean {
  const ownerState = loadBusinessOwnerState();
  const claimIndex = ownerState.claims.findIndex((c) => c.id === claimId);
  if (claimIndex === -1) return false;

  const claim = ownerState.claims[claimIndex];

  // Prevent duplicate approval if already approved
  if (claim.status === "approved") return true;

  // Check if business is already managed by someone else
  const existingManaged = getManagedBusiness(claim.businessId);
  const targetMock = mockBusinesses.find((b) => b.id === claim.businessId);
  if (existingManaged || targetMock?.claimStatus === "claimed") {
    // If it's already managed, we shouldn't allow another claim
    return false;
  }

  // Update claim status
  const updatedClaim: BusinessClaim = {
    ...claim,
    status: "approved",
    reviewedAt: new Date().toISOString(),
    reviewedBy: "Cafnet Admin",
  };

  const updatedClaims = [...ownerState.claims];
  updatedClaims[claimIndex] = updatedClaim;
  saveBusinessOwnerState({ ...ownerState, claims: updatedClaims });

  // Create managed business entry so claimant has immediate management access
  createManagedBusiness(claim.businessId, {
    name: targetMock?.name || "Managed Business",
    category: targetMock?.category || "restaurant",
    location: targetMock?.location || "",
    phone: targetMock?.phone || "",
    description: targetMock?.description || "",
    priceRange: targetMock?.priceRange || "$$",
  });

  // Apply basic verification automatically on claim approval
  setBusinessVerification(claim.businessId, true);

  return true;
}

export function rejectClaim(claimId: string, reason: string): boolean {
  const ownerState = loadBusinessOwnerState();
  const claimIndex = ownerState.claims.findIndex((c) => c.id === claimId);
  if (claimIndex === -1) return false;

  const claim = ownerState.claims[claimIndex];
  const updatedClaim: BusinessClaim = {
    ...claim,
    status: "rejected",
    rejectionReason: reason.trim(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: "Cafnet Admin",
  };

  const updatedClaims = [...ownerState.claims];
  updatedClaims[claimIndex] = updatedClaim;
  saveBusinessOwnerState({ ...ownerState, claims: updatedClaims });

  return true;
}

// -------------------------------------------------------------
// Submission Actions
// -------------------------------------------------------------

export function approveSubmission(submissionId: string): { success: boolean; businessId?: number } {
  const ownerState = loadBusinessOwnerState();
  const subIndex = ownerState.submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) return { success: false };

  const submission = ownerState.submissions[subIndex];
  if (submission.status === "approved" && submission.createdBusinessId) {
    return { success: true, businessId: submission.createdBusinessId };
  }

  // Calculate new unique business ID
  const adminState = loadAdminState();
  const allIds = [
    ...mockBusinesses.map((b) => b.id),
    ...adminState.publishedBusinesses.map((b) => b.id),
  ];
  const nextId = Math.max(0, ...allIds) + 1;

  // Create full MockBusiness representation
  const newBusiness: MockBusiness = {
    id: nextId,
    name: submission.businessName,
    category: submission.category,
    cuisine:
      submission.category === "cafe"
        ? "Coffee & Bakery"
        : submission.category === "drinks"
        ? "Juices & Drinks"
        : "Traditional & Modern Dining",
    location: submission.area,
    neighborhood: submission.area,
    distance: "Central",
    rating: 0,
    reviewCount: 0,
    priceRange: "$$",
    description: `${submission.businessName} is a welcoming ${submission.category} located in ${submission.area}, Addis Ababa.`,
    shortDescription: `${submission.businessName} in ${submission.area}.`,
    images: ["/images/placeholder1.jpeg", "/images/placeholder2.jpeg"],
    tags: ["Family friendly"],
    paymentMethods: ["Cash", "Telebirr"],
    openingHours: "8:00 AM - 10:00 PM",
    phone: "",
    verified: true,
    reservationAvailable: false,
    claimStatus: "claimed",
    featured: false,
    isOpen: true,
    menu: [],
    updates: [],
    reviews: [],
  };

  // Add to published businesses
  const updatedAdminState: AdminState = {
    ...adminState,
    publishedBusinesses: [...adminState.publishedBusinesses, newBusiness],
    verifiedOverrides: {
      ...adminState.verifiedOverrides,
      [nextId]: true,
    },
  };
  saveAdminState(updatedAdminState);

  // Update submission record
  const updatedSubmission: BusinessSubmission = {
    ...submission,
    status: "approved",
    createdBusinessId: nextId,
    reviewedAt: new Date().toISOString(),
    reviewedBy: "Cafnet Admin",
  };
  const updatedSubmissions = [...ownerState.submissions];
  updatedSubmissions[subIndex] = updatedSubmission;
  saveBusinessOwnerState({ ...ownerState, submissions: updatedSubmissions });

  // Create managed business for the submitter
  createManagedBusiness(nextId, {
    name: newBusiness.name,
    category: newBusiness.category,
    location: newBusiness.location,
    description: newBusiness.description,
    priceRange: newBusiness.priceRange,
    tags: newBusiness.tags,
  });

  return { success: true, businessId: nextId };
}

export function rejectSubmission(submissionId: string, reason: string): boolean {
  const ownerState = loadBusinessOwnerState();
  const subIndex = ownerState.submissions.findIndex((s) => s.id === submissionId);
  if (subIndex === -1) return false;

  const submission = ownerState.submissions[subIndex];
  const updatedSubmission: BusinessSubmission = {
    ...submission,
    status: "rejected",
    rejectionReason: reason.trim(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: "Cafnet Admin",
  };

  const updatedSubmissions = [...ownerState.submissions];
  updatedSubmissions[subIndex] = updatedSubmission;
  saveBusinessOwnerState({ ...ownerState, submissions: updatedSubmissions });

  return true;
}

// -------------------------------------------------------------
// Operational Stats
// -------------------------------------------------------------

export type AdminStats = {
  pendingClaimsCount: number;
  approvedClaimsCount: number;
  rejectedClaimsCount: number;
  pendingSubmissionsCount: number;
  approvedSubmissionsCount: number;
  rejectedSubmissionsCount: number;
  totalBusinessesCount: number;
  verifiedBusinessesCount: number;
};

export function getAdminStats(allBusinesses: MockBusiness[]): AdminStats {
  const ownerState = loadBusinessOwnerState();
  const adminState = loadAdminState();

  const pendingClaimsCount = ownerState.claims.filter((c) => c.status === "pending").length;
  const approvedClaimsCount = ownerState.claims.filter((c) => c.status === "approved").length;
  const rejectedClaimsCount = ownerState.claims.filter((c) => c.status === "rejected").length;

  const pendingSubmissionsCount = ownerState.submissions.filter((s) => s.status === "pending").length;
  const approvedSubmissionsCount = ownerState.submissions.filter((s) => s.status === "approved").length;
  const rejectedSubmissionsCount = ownerState.submissions.filter((s) => s.status === "rejected").length;

  const totalBusinessesCount = allBusinesses.length;
  const verifiedBusinessesCount = allBusinesses.filter((b) => {
    if (adminState.verifiedOverrides[b.id] !== undefined) {
      return adminState.verifiedOverrides[b.id];
    }
    return b.verified;
  }).length;

  return {
    pendingClaimsCount,
    approvedClaimsCount,
    rejectedClaimsCount,
    pendingSubmissionsCount,
    approvedSubmissionsCount,
    rejectedSubmissionsCount,
    totalBusinessesCount,
    verifiedBusinessesCount,
  };
}
