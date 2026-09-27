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

export function loadReservations() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) as MockReservation[] : [];
  } catch {
    return [];
  }
}

export function saveReservations(reservations: MockReservation[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reservations));
}