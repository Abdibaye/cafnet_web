import type { MockCustomer } from "@/components/CustomerProvider";

const customerStorageKey = "cafnet.mock-customer";

const defaultCustomer: MockCustomer = {
  id: "mock-customer-abdi",
  name: "Abdi",
  phone: "+251 9XX XXX XXX",
  avatar: "A",
  savedBusinessIds: [],
  followedBusinessIds: [],
};

export function loadMockCustomer(): MockCustomer | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(customerStorageKey);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      id: typeof parsed.id === "string" && parsed.id ? parsed.id : defaultCustomer.id,
      name: typeof parsed.name === "string" && parsed.name ? parsed.name : defaultCustomer.name,
      phone: typeof parsed.phone === "string" ? parsed.phone : defaultCustomer.phone,
      avatar: typeof parsed.avatar === "string" && parsed.avatar ? parsed.avatar : defaultCustomer.avatar,
      savedBusinessIds: Array.isArray(parsed.savedBusinessIds)
        ? parsed.savedBusinessIds.filter((id: unknown) => typeof id === "number")
        : [],
      followedBusinessIds: Array.isArray(parsed.followedBusinessIds)
        ? parsed.followedBusinessIds.filter((id: unknown) => typeof id === "number")
        : [],
    };
  } catch {
    return null;
  }
}

export function saveMockCustomer(customer: MockCustomer) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(customerStorageKey, JSON.stringify(customer));
    window.dispatchEvent(new CustomEvent("cafnet:customer-updated"));
  } catch {
    // Ignore storage write failures (e.g. quota or privacy modes)
  }
}