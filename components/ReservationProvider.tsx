"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import * as reservationsApi from "@/lib/api/reservations";
import { ApiError } from "@/lib/api/errors";
import {
  formatReservationTimeForApi,
  reservationToViewModel,
} from "@/lib/api/adapters";
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
  createReservation: (
    draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">,
  ) => Promise<MockReservation | null>;
  cancelReservation: (id: string) => Promise<ReservationResult>;
  confirmBooking: (id: string, reviewerName?: string) => ReservationResult;
  declineBooking: (id: string, reason: string, reviewerName?: string) => ReservationResult;
  completeBooking: (id: string, reviewerName?: string) => ReservationResult;
};

const ReservationContext = createContext<ReservationContextValue | null>(null);

export function ReservationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, showToast } = useCustomer();
  const [ready, setReady] = useState(false);
  const [reservations, setReservations] = useState<MockReservation[]>([]);

  const refreshReservations = useCallback(async () => {
    if (!currentUser) {
      setReservations(loadReservations());
      setReady(true);
      return;
    }

    try {
      const apiList = await reservationsApi.listCustomerReservations();
      if (Array.isArray(apiList)) {
        const adapted = apiList.map(reservationToViewModel);
        setReservations(adapted);
      }
    } catch {
      // If network is offline or server unreachable, maintain resilient offline state
      setReservations(loadReservations());
    } finally {
      setReady(true);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshReservations();

    const handleUpdate = () => refreshReservations();
    window.addEventListener("cafnet:reservations-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:reservations-updated", handleUpdate);
  }, [refreshReservations]);

  const createReservation = async (
    draft: Omit<MockReservation, "id" | "customerId" | "status" | "createdAt">,
  ): Promise<MockReservation | null> => {
    if (!currentUser) return null;

    try {
      const apiTime = formatReservationTimeForApi(draft.time);

      const created = await reservationsApi.createReservation({
        business_id: draft.businessId,
        party_size: draft.partySize,
        reservation_date: draft.date,
        reservation_time: apiTime,
        special_request: draft.specialRequest?.trim() || "",
        customer_name: currentUser.name,
        customer_phone: currentUser.phone,
      });

      const viewModel = reservationToViewModel(created);
      setReservations((prev) => [viewModel, ...prev.filter((r) => r.id !== viewModel.id)]);
      showToast("Reservation request submitted — awaiting restaurant confirmation");
      return viewModel;
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        showToast(err.message);
        return null;
      }

      // Offline / fallback mock storage
      const fallback: MockReservation = {
        ...draft,
        id: `CAF-${String(Date.now()).slice(-4)}`,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerPhone: currentUser.phone,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const next = [fallback, ...reservations];
      setReservations(next);
      saveReservations(next);
      showToast("Reservation request submitted — awaiting restaurant confirmation");
      return fallback;
    }
  };

  const cancelReservation = async (id: string): Promise<ReservationResult> => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (currentUser && isUuid) {
      try {
        await reservationsApi.cancelReservation(id);
        setReservations((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: "cancelled", cancelledAt: new Date().toISOString() }
              : r,
          ),
        );
        showToast("Reservation cancelled");
        return { success: true };
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : "Failed to cancel reservation";
        showToast(msg);
        return { success: false, error: msg };
      }
    }

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
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "confirmed", confirmedAt: new Date().toISOString(), reviewedBy: reviewerName }
            : r,
        ),
      );
      showToast("Reservation confirmed");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const declineBooking = (id: string, reason: string, reviewerName: string = "Restaurant Manager"): ReservationResult => {
    const res = declineReservation(id, reason, reviewerName);
    if (res.success) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "declined", declineReason: reason, declinedAt: new Date().toISOString(), reviewedBy: reviewerName }
            : r,
        ),
      );
      showToast("Reservation declined");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const completeBooking = (id: string, reviewerName: string = "Restaurant Manager"): ReservationResult => {
    const res = completeReservation(id, reviewerName);
    if (res.success) {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "completed", completedAt: new Date().toISOString(), reviewedBy: reviewerName }
            : r,
        ),
      );
      showToast("Reservation marked as completed");
    } else if (res.error) {
      showToast(res.error);
    }
    return res;
  };

  const customerReservations = currentUser
    ? reservations.filter((reservation) => reservation.customerId === currentUser.id)
    : [];

  return (
    <ReservationContext.Provider
      value={{
        ready,
        reservations: customerReservations,
        allReservations: reservations,
        getReservation: (id) =>
          customerReservations.find((reservation) => reservation.id === id) ||
          reservations.find((r) => r.id === id),
        getReservationsForBusiness: (businessId) =>
          reservations.filter((r) => r.businessId === businessId),
        createReservation,
        cancelReservation,
        confirmBooking,
        declineBooking,
        completeBooking,
      }}
    >
      {children}
    </ReservationContext.Provider>
  );
}

export function useReservations() {
  const context = useContext(ReservationContext);
  if (!context) throw new Error("useReservations must be used inside ReservationProvider");
  return context;
}
