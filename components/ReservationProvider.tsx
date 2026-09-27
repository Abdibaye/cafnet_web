"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { loadReservations, saveReservations, type MockReservation } from "@/data/reservationStorage";

type ReservationContextValue = {
  ready: boolean;
  reservations: MockReservation[];
  getReservation: (id: string) => MockReservation | undefined;
  createReservation: (draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">) => MockReservation | null;
  cancelReservation: (id: string) => void;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useCustomer();
  const [ready, setReady] = useState(false);
  const [reservations, setReservations] = useState<MockReservation[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      setReservations(loadReservations());
      setReady(true);
    });
  }, []);

  const createReservation = (draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">) => {
    if (!currentUser) return null;
    const reservation: MockReservation = {
      ...draft,
      id: `CAF-${String(Date.now()).slice(-4)}`,
      customerId: currentUser.id,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    const next = [...reservations, reservation];
    setReservations(next);
    saveReservations(next);
    return reservation;
  };

  const cancelReservation = (id: string) => {
    const next = reservations.map((reservation) => reservation.id === id ? { ...reservation, status: "cancelled" as const } : reservation);
    setReservations(next);
    saveReservations(next);
  };

  const customerReservations = currentUser ? reservations.filter((reservation) => reservation.customerId === currentUser.id) : [];
  return <ReservationContext.Provider value={{ ready, reservations: customerReservations, getReservation: (id) => customerReservations.find((reservation) => reservation.id === id), createReservation, cancelReservation }}>{children}</ReservationContext.Provider>;
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservations must be used inside ReservationProvider");
  return context;
}