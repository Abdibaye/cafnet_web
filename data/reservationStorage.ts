export type ReservationStatus = "pending" | "confirmed" | "declined" | "cancelled" | "completed";

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
  confirmedAt?: string;
  declinedAt?: string;
  declineReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  reviewedBy?: string;
};

const storageKey = "cafnet.mock-reservations";

// Deterministic seed data covering all 5 reservation lifecycle states
export const mockSeedReservations: MockReservation[] = [
  {
    id: "CAF-1001",
    businessId: 1,
    customerId: "mock-customer-abdi",
    customerName: "Abdi",
    customerPhone: "+251 911 234 567",
    date: new Date().toISOString().slice(0, 10), // Today
    time: "7:30 PM",
    partySize: 4,
    specialRequest: "Window table if possible.",
    status: "pending",
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
  },
  {
    id: "CAF-1002",
    businessId: 1,
    customerId: "mock-customer-abdi",
    customerName: "Abdi",
    customerPhone: "+251 911 234 567",
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10), // Tomorrow
    time: "8:00 PM",
    partySize: 2,
    specialRequest: "Celebrating a special anniversary.",
    status: "confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    reviewedBy: "Restaurant Manager",
  },
  {
    id: "CAF-1003",
    businessId: 1,
    customerId: "mock-customer-abdi",
    customerName: "Abdi",
    customerPhone: "+251 911 234 567",
    date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString().slice(0, 10), // 2 days ago
    time: "7:00 PM",
    partySize: 2,
    specialRequest: "Quiet booth table.",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
    reviewedBy: "Restaurant Manager",
  },
  {
    id: "CAF-1004",
    businessId: 1,
    customerId: "mock-customer-abdi",
    customerName: "Abdi",
    customerPhone: "+251 911 234 567",
    date: new Date().toISOString().slice(0, 10),
    time: "9:00 PM",
    partySize: 8,
    specialRequest: "Large family group.",
    status: "declined",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    declinedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    declineReason: "Fully booked at this hour",
    reviewedBy: "Restaurant Manager",
  },
  {
    id: "CAF-1005",
    businessId: 1,
    customerId: "mock-customer-abdi",
    customerName: "Abdi",
    customerPhone: "+251 911 234 567",
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
    time: "6:30 PM",
    partySize: 3,
    specialRequest: "",
    status: "cancelled",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    cancelledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5.5).toISOString(),
  },
];

const memoryFallbackReservations: MockReservation[] = [...mockSeedReservations];

export function loadReservations(): MockReservation[] {
  if (typeof window === "undefined") return memoryFallbackReservations;
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      // First time initialization with seed reservations
      window.localStorage.setItem(storageKey, JSON.stringify(mockSeedReservations));
      return [...mockSeedReservations];
    }
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
          r.status === "cancelled" ||
          r.status === "completed")
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
  return all
    .filter((r) => r.businessId === businessId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPendingReservationsCount(businessId: number): number {
  const all = loadReservations();
  return all.filter((r) => r.businessId === businessId && r.status === "pending").length;
}

export function getReservationById(id: string): MockReservation | undefined {
  const all = loadReservations();
  return all.find((r) => r.id === id);
}

// -------------------------------------------------------------
// Controlled Lifecycle Transitions & Double Action Protection
// -------------------------------------------------------------

export function confirmReservation(
  reservationId: string,
  reviewerName: string = "Restaurant Manager"
): { success: boolean; error?: string } {
  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) {
    return { success: false, error: "Reservation not found." };
  }

  const target = all[index];
  if (target.status === "confirmed") {
    return { success: false, error: "This reservation has already been confirmed." };
  }
  if (target.status === "declined") {
    return { success: false, error: "Cannot confirm a reservation that has already been declined." };
  }
  if (target.status === "cancelled") {
    return { success: false, error: "Cannot confirm a reservation that was cancelled." };
  }
  if (target.status === "completed") {
    return { success: false, error: "This reservation has already been completed." };
  }

  const updated: MockReservation = {
    ...target,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return { success: true };
}

export function declineReservation(
  reservationId: string,
  reason: string,
  reviewerName: string = "Restaurant Manager"
): { success: boolean; error?: string } {
  const trimmed = reason ? reason.trim() : "";
  if (!trimmed) {
    return { success: false, error: "A reason is required to decline this reservation." };
  }

  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) {
    return { success: false, error: "Reservation not found." };
  }

  const target = all[index];
  if (target.status === "declined") {
    return { success: false, error: "This reservation has already been declined." };
  }
  if (target.status === "confirmed") {
    return { success: false, error: "Cannot decline a reservation that has already been confirmed." };
  }
  if (target.status === "completed") {
    return { success: false, error: "Cannot decline a reservation that has already been completed." };
  }
  if (target.status === "cancelled") {
    return { success: false, error: "Cannot decline a reservation that was cancelled." };
  }

  const updated: MockReservation = {
    ...target,
    status: "declined",
    declineReason: trimmed,
    declinedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return { success: true };
}

export function completeReservation(
  reservationId: string,
  reviewerName: string = "Restaurant Manager"
): { success: boolean; error?: string } {
  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) {
    return { success: false, error: "Reservation not found." };
  }

  const target = all[index];
  if (target.status === "completed") {
    return { success: false, error: "This reservation has already been marked as completed." };
  }
  if (target.status !== "confirmed") {
    return { success: false, error: "Only confirmed reservations can be marked as completed." };
  }

  const updated: MockReservation = {
    ...target,
    status: "completed",
    completedAt: new Date().toISOString(),
    reviewedBy: reviewerName,
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return { success: true };
}

export function cancelReservation(
  reservationId: string
): { success: boolean; error?: string } {
  const all = loadReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) {
    return { success: false, error: "Reservation not found." };
  }

  const target = all[index];
  if (target.status === "completed") {
    return { success: false, error: "A completed visit cannot be cancelled." };
  }
  if (target.status === "cancelled") {
    return { success: false, error: "This reservation is already cancelled." };
  }
  if (target.status === "declined") {
    return { success: false, error: "This reservation was already declined." };
  }

  const updated: MockReservation = {
    ...target,
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
  };

  const next = [...all];
  next[index] = updated;
  saveReservations(next);
  return { success: true };
}