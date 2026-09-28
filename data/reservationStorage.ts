export type ReservationStatus = "confirmed" | "cancelled";

export type MockReservation = {
  id: string;
  businessId: number;
  customerId: string;
  date: string;
  time: string;
  partySize: number;
  specialRequest: string;
  status: ReservationStatus;
  createdAt: string;
};

const storageKey = "cafnet.mock-reservations";

export function loadReservations(): MockReservation[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((r): r is MockReservation =>
      Boolean(
        r &&
        typeof r === "object" &&
        typeof r.id === "string" &&
        typeof r.businessId === "number" &&
        (r.status === "confirmed" || r.status === "cancelled")
      )
    );
  } catch {
    return [];
  }
}

export function saveReservations(reservations: MockReservation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(reservations));
    window.dispatchEvent(new CustomEvent("cafnet:reservations-updated"));
  } catch {
    // Ignore storage write failures
  }
}