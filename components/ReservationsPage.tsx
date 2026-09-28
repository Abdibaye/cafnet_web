"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import { getBusinessById } from "@/data/mockBusinesses";
import type { MockReservation } from "@/data/reservationStorage";

export default function ReservationsPage() {
  const { authReady, isAuthenticated, startSignIn } = useCustomer();
  const { ready, reservations } = useReservations();

  if (!authReady || !ready) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
        Loading reservations...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Sign in to see your reservations</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Your Cafnet reservations will appear here.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Sign in
        </button>
      </div>
    );
  }

  const pending = reservations.filter((r) => r.status === "pending");
  const confirmed = reservations.filter((r) => r.status === "confirmed");
  const past = reservations.filter((r) => r.status === "cancelled" || r.status === "declined");

  const renderStatusBadge = (status: MockReservation["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            Pending confirmation
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            Confirmed
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            <span className="material-symbols-outlined text-[14px]">cancel</span>
            Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
            Cancelled
          </span>
        );
    }
  };

  const renderSection = (title: string, subtitle: string, items: MockReservation[]) => {
    if (items.length === 0) return null;
    return (
      <section className="mt-8">
        <div>
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <p className="text-xs text-on-surface-variant">{subtitle}</p>
        </div>
        <div className="mt-3 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
          {items.map((reservation) => {
            const business = getBusinessById(reservation.businessId);
            return (
              <Link
                key={reservation.id}
                href={`/reservations/${reservation.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-surface-container-low transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-on-surface">
                    {business?.name || `Business #${reservation.businessId}`}
                  </h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    {new Date(`${reservation.date}T12:00:00`).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {reservation.time} · {reservation.partySize}{" "}
                    {reservation.partySize === 1 ? "person" : "people"}
                  </p>
                  {reservation.specialRequest && (
                    <p className="mt-1 text-xs text-on-surface-variant italic line-clamp-1">
                      Note: &ldquo;{reservation.specialRequest}&rdquo;
                    </p>
                  )}
                </div>
                <div className="shrink-0">{renderStatusBadge(reservation.status)}</div>
              </Link>
            );
          })}
        </div>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Your Cafnet
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">My reservations</h1>

      {reservations.length === 0 ? (
        <div className="mt-10 border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-on-surface">No reservations yet.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            Find somewhere you&apos;d like to eat and your table reservation requests will appear here.
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
          >
            Explore restaurants
          </Link>
        </div>
      ) : (
        <>
          {renderSection(
            "Pending requests",
            "Waiting for the restaurant to confirm availability",
            pending
          )}
          {renderSection(
            "Confirmed bookings",
            "Accepted and ready for your visit",
            confirmed
          )}
          {renderSection(
            "Past & Inactive",
            "Cancelled or declined bookings",
            past
          )}
        </>
      )}
    </div>
  );
}