import type { MockCustomer } from "@/components/CustomerProvider";

const customerStorageKey = "cafnet.mock-customer";

export function loadMockCustomer() {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(customerStorageKey);
    return stored ? JSON.parse(stored) as MockCustomer : null;
  } catch {
    return null;
  }
}

export function saveMockCustomer(customer: MockCustomer) {
  window.localStorage.setItem(customerStorageKey, JSON.stringify(customer));
}