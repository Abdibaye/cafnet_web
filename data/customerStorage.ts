import type { MockCustomer } from "@/components/CustomerProvider";

/**
 * @deprecated Authoritative user and account state is strictly Go-native backend session driven (/api/v1/auth/me).
 * LocalStorage customer identity has been removed per Backend 18 specifications.
 */
export const defaultCustomer: MockCustomer = {
  id: "",
  name: "Customer",
  phone: "+251 9XX XXX XXX",
  avatar: "C",
  profileCompleted: true,
  savedBusinessIds: [],
  followedBusinessIds: [],
};

export function loadMockCustomer(): MockCustomer | null {
  return null;
}

export function saveMockCustomer(_customer: MockCustomer) {
  // Authoritative identity and profile reside exclusively in PostgreSQL sessions via /api/v1/auth/me
}