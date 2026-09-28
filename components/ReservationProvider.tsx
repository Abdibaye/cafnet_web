"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import {
  loadReservations,
  saveReservations,
  confirmReservation,
  declineReservation,
  completeReservation,
  cancelReservation as storageCancelReservation,
  type MockReservation,
} from "@/data/reservationStorage";

export type ReservationResult = { success: boolean; error?: string };

type ReservationContextValue = {
  ready: boolean;
  reservations: MockReservation[];
  allReservations: MockReservation[];
  getReservation: (id: string) => MockReservation | undefined;
  getReservationsForBusiness: (businessId: number) => MockReservation[];
  createReservation: (draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">) => MockReservation | null;
  cancelReservation: (id: string) => ReservationResult;
  confirmBooking: (id: string, reviewerName?: string) => ReservationResult;
  declineBooking: (id: string, reason: string, reviewerName?: string) => ReservationResult;
  completeBooking: (id: string, reviewerName?: string) => ReservationResult;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, showToast } = useCustomer();
  const [ready, setReady] = useState(false);
  const [reservations, setReservations] = useState<MockReservation[]>([]);

  const refreshReservations = useCallback(() => {
    setReservations(loadReservations());
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshReservations();
      setReady(true);
    });

    const handleUpdate = () => refreshReservations();
    window.addEventListener("cafnet:reservations-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:reservations-updated", handleUpdate);
  }, [refreshReservations]);

  const createReservation = (draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">) => {
    if (!currentUser) return null;
    const reservation: MockReservation = {
      ...draft,
      id: `CAF-${String(Date.now()).slice(-4)}`,
      customerId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phone,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    const next = [reservation, ...reservations];
    setReservations(next);
    saveReservations(next);
    showToast("Reservation request submitted — awaiting restaurant confirmation");
    return reservation;
  };

  const cancelReservation = (id: string): ReservationResult => {
    const res = storageCancelReservation(id);
    if (res.success) {
      refreshReservations();
      showToast("Reservation cancelled");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const confirmBooking = (id: string, reviewerName: string = "Restaurant Manager"): ReservationResult => {
    const res = confirmReservation(id, reviewerName);
    if (res.success) {
      refreshReservations();
      showToast("Reservation confirmed");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const declineBooking = (id: string, reason: string, reviewerName: string = "Restaurant Manager"): ReservationResult => {
    const res = declineReservation(id, reason, reviewerName);
    if (res.success) {
      refreshReservations();
      showToast("Reservation declined");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const completeBooking = (id: string, reviewerName: string = "Restaurant Manager"): ReservationResult => {
    const res = completeReservation(id, reviewerName);
    if (res.success) {
      refreshReservations();
      showToast("Reservation marked as completed");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const customerReservations = currentUser ? reservations.filter((reservation) => reservation.customerId === currentUser.id) : [];

  return (
    <ReservationContext.Provider value={{
      ready,
      reservations: customerReservations,
      allReservations: reservations,
      getReservation: (id) => customerReservations.find((reservation) => reservation.id === id) || reservations.find((r) => r.id === id),
      getReservationsForBusiness: (businessId) => reservations.filter((r) => r.businessId === businessId),
      createReservation,
      cancelReservation,
      confirmBooking,
      declineBooking,
      completeBooking,
    }}>
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservations must be used inside ReservationProvider");
  return context;
}
