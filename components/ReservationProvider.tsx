"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import {
  loadReservations,
  saveReservations,
  confirmReservation,
  declineReservation,
  type MockReservation,
} from "@/data/reservationStorage";

type ReservationContextValue = {
  ready: boolean;
  reservations: MockReservation[];
  allReservations: MockReservation[];
  getReservation: (id: string) => MockReservation | undefined;
  getReservationsForBusiness: (businessId: number) => MockReservation[];
  createReservation: (draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">) => MockReservation | null;
  cancelReservation: (id: string) => boolean;
  confirmBooking: (id: string, reviewerName?: string) => boolean;
  declineBooking: (id: string, reason?: string, reviewerName?: string) => boolean;
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

  const cancelReservation = (id: string): boolean => {
    const existing = reservations.find((r) => r.id === id);
    if (!existing) return false;
    const next = reservations.map((reservation) => 
      reservation.id === id ? { ...reservation, status: "cancelled" as const } : reservation
    );
    setReservations(next);
    saveReservations(next);
    showToast("Reservation cancelled");
    return true;
  };

  const confirmBooking = (id: string, reviewerName: string = "Restaurant Manager"): boolean => {
    const success = confirmReservation(id, reviewerName);
    if (success) {
      refreshReservations();
      showToast("Reservation confirmed");
    }
    return success;
  };

  const declineBooking = (id: string, reason?: string, reviewerName: string = "Restaurant Manager"): boolean => {
    const success = declineReservation(id, reason, reviewerName);
    if (success) {
      refreshReservations();
      showToast("Reservation declined");
    }
    return success;
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
