export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled";

export type MockReservation = {
  id: string;
  businessId: number;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  time: string;
  partySize: number;
  specialRequest: string;
  status: ReservationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  declineReason?: string;
};

const storageKey = "cafnet.mock-reservations";
const memoryFallbackReservations: MockReservation[] = [];

export function loadReservations(): MockReservation[] {
  if (typeof window === "undefined") return memoryFallbackReservations;
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
        (r.status === "pending" ||
          r.status === "confirmed" ||
          r.status === "declined" ||
          r.status === "cancelled")
      )
    );
  } catch {
    return [];
  }
}

export function saveReservations(reservations: MockReservation[]) {
  if (typeof window === "undefined") {
    memoryFallbackReservations.length = 0;
    memoryFallbackReservations.push(...reservations);
    return;
  }
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(reservations));
    window.dispatchEvent(new CustomEvent("cafnet:reservations-updated"));
  } catch {
    // Ignore storage write failures
  }
}

export function getReservationsByBusiness(businessId: number): MockReservation[] {
  const all = loadReservations();
  return all.filter((r) => r.businessId === businessId);
}

export function getPendingReservationsCount(businessId: number): number {
  const all = loadReservations();
  return all.filter((r) => r.businessId === businessId && r.status === "pending").length;
}

export function confirmReservation(
  reservationId: string,
  reviewerName: string = "Restaurant Manager"
): boolean {
  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) return false;

  const target = all[index];
  if (target.status !== "pending") return false;

  const updated: MockReservation = {
    ...target,
    status: "confirmed",
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return true;
}

export function declineReservation(
  reservationId: string,
  reason: string = "Table unavailable",
  reviewerName: string = "Restaurant Manager"
): boolean {
  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) return false;

  const target = all[index];
  if (target.status !== "pending") return false;

  const updated: MockReservation = {
    ...target,
    status: "declined",
    declineReason: reason.trim(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return true;
}