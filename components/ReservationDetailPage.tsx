"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useReservations } from "@/components/ReservationProvider";
import { getBusinessProfile } from "@/lib/api/businesses";

export default function ReservationDetailPage({ reservationId }: { reservationId: string }) {
  const { ready, getReservation, cancelReservation } = useReservations();
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [businessName, setBusinessName] = useState<string | null>(null);

  const reservation = getReservation(reservationId);

  useEffect(() => {
    if (!reservation?.businessId) return;
    getBusinessProfile(reservation.businessId)
      .then((p) => {
        if (p?.business?.name) setBusinessName(p.business.name);
      })
      .catch(() => {});
  }, [reservation?.businessId]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-on-surface-variant">
        Loading reservation...
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Reservation not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          This reservation may no longer be available.
        </p>
        <Link href="/reservations" className="mt-6 inline-flex text-sm font-semibold text-primary">
          My reservations
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(`${reservation.date}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const isPending = reservation.status === "pending";
  const isConfirmed = reservation.status === "confirmed";
  const isCompleted = reservation.status === "completed";
  const isDeclined = reservation.status === "declined";
  const isCancelled = reservation.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 lg:px-0 lg:py-16">
      <Link href="/reservations" className="text-sm font-semibold text-primary">
        ← My reservations
      </Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Reservation
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">
        {businessName || `Business #${reservation.businessId}`}
      </h1>

      {/* Status Notice Banners */}
      {isPending && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <span className="material-symbols-outlined text-[20px] text-amber-700">schedule</span>
          <div>
            <p className="font-bold">Waiting for restaurant confirmation.</p>
            <p className="mt-0.5 text-amber-800">
              The restaurant team has received your table request. You will see it confirmed here as soon as they accept.
            </p>
          </div>
        </div>
      )}

      {isConfirmed && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
          <span className="material-symbols-outlined text-[20px] text-emerald-700">check_circle</span>
          <div>
            <p className="font-bold">Your table has been confirmed.</p>
            <p className="mt-0.5 text-emerald-800">
              Your table is booked and ready for your visit. Please arrive on time.
            </p>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-container/30 p-4 text-xs text-primary">
          <span className="material-symbols-outlined text-[20px] text-primary">verified</span>
          <div>
            <p className="font-bold">Visit completed.</p>
            <p className="mt-0.5 text-on-surface-variant">
              Your visit has been confirmed by the restaurant. You are now eligible to leave a verified review.
            </p>
          </div>
        </div>
      )}

      {isDeclined && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
          <span className="material-symbols-outlined text-[20px] text-red-700">cancel</span>
          <div>
            <p className="font-bold">The restaurant could not accept this request.</p>
            <p className="mt-0.5 text-red-800">
              {reservation.declineReason
                ? `Reason: "${reservation.declineReason}"`
                : "The restaurant was unable to accommodate this booking request."}
            </p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-xs text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] text-outline">block</span>
          <div>
            <p className="font-bold text-on-surface">Reservation cancelled.</p>
            <p className="mt-0.5">
              This reservation has been cancelled.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        <div className="p-5">
          <p className="text-xs text-on-surface-variant font-semibold">Status</p>
          <div className="mt-1 flex items-center gap-2">
            {isPending && (
              <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 text-sm">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
                Pending confirmation
              </span>
            )}
            {isConfirmed && (
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Confirmed
              </span>
            )}
            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 font-bold text-primary text-sm">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Visit completed
              </span>
            )}
            {isDeclined && (
              <div>
                <span className="inline-flex items-center gap-1.5 font-bold text-red-700 text-sm">
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  Declined
                </span>
                {reservation.declineReason && (
                  <p className="mt-1 text-xs text-red-600">Reason: {reservation.declineReason}</p>
                )}
              </div>
            )}
            {isCancelled && (
              <span className="inline-flex items-center gap-1.5 font-bold text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-[18px]">block</span>
                Cancelled
              </span>
            )}
          </div>
        </div>

        <div className="p-5">
          <p className="text-xs text-on-surface-variant font-semibold">Date</p>
          <p className="mt-1 font-semibold text-on-surface">{formattedDate}</p>
        </div>

        <div className="p-5">
          <p className="text-xs text-on-surface-variant font-semibold">Time</p>
          <p className="mt-1 font-semibold text-on-surface">{reservation.time}</p>
        </div>

        <div className="p-5">
          <p className="text-xs text-on-surface-variant font-semibold">Guests</p>
          <p className="mt-1 font-semibold text-on-surface">
            {reservation.partySize} {reservation.partySize === 1 ? "person" : "people"}
          </p>
        </div>

        {reservation.specialRequest && (
          <div className="p-5">
            <p className="text-xs text-on-surface-variant font-semibold">Special request</p>
            <p className="mt-1 font-semibold text-on-surface">{reservation.specialRequest}</p>
          </div>
        )}

        <div className="p-5">
          <p className="text-xs text-on-surface-variant font-semibold">Reservation ID</p>
          <p className="mt-1 font-semibold text-primary font-mono">{reservation.id}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`/business/${reservation.businessId}`}
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
        >
          View restaurant
        </Link>

        {isCompleted && (
          <Link
            href={`/business/${reservation.businessId}#reviews`}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-primary bg-primary-container/20 px-5 text-sm font-bold text-primary hover:bg-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            Write a verified review
          </Link>
        )}

        {(isPending || isConfirmed) && (
          <button
            type="button"
            className="inline-flex h-11 items-center rounded-xl border border-outline-variant px-5 text-sm font-semibold text-secondary hover:bg-secondary-container"
            onClick={() => setShowCancel(true)}
          >
            {isPending ? "Cancel request" : "Cancel reservation"}
          </button>
        )}
      </div>

      {showCancel && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-on-surface/30 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-reservation-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="cancel-reservation-title" className="text-lg font-bold text-on-surface">
              {isPending ? "Cancel reservation request?" : "Cancel reservation?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="h-11 flex-1 rounded-xl border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container"
                onClick={() => setShowCancel(false)}
              >
                Keep booking
              </button>
              <button
                type="button"
                disabled={cancelling}
                className="h-11 flex-1 rounded-xl bg-secondary text-sm font-semibold text-white hover:bg-secondary/90 shadow-sm disabled:opacity-50"
                onClick={async () => {
                  setCancelling(true);
                  try {
                    await cancelReservation(reservation.id);
                    setShowCancel(false);
                  } finally {
                    setCancelling(false);
                  }
                }}
              >
                {cancelling ? "Cancelling..." : isPending ? "Cancel request" : "Cancel reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
