"use client";

import { useState } from "react";
import Link from "next/link";
import { useReservations } from "@/components/ReservationProvider";
import { getBusinessById } from "@/data/mockBusinesses";
import type { MockReservation } from "@/data/reservationStorage";

export default function BusinessReservationsPage({ businessId }: { businessId: string }) {
  const business = getBusinessById(businessId);
  const { ready, getReservationsForBusiness, confirmBooking, declineBooking } = useReservations();

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed" | "history">("pending");
  const [decliningReservation, setDecliningReservation] = useState<MockReservation | null>(null);
  const [declineReason, setDeclineReason] = useState("Fully booked at this hour");
  const [customReason, setCustomReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  const businessReservations = ready ? getReservationsForBusiness(Number(businessId)) : [];

  const pending = businessReservations.filter((r) => r.status === "pending");
  const confirmed = businessReservations.filter((r) => r.status === "confirmed");
  const history = businessReservations.filter((r) => r.status === "declined" || r.status === "cancelled");

  const handleConfirm = (reservationId: string) => {
    confirmBooking(reservationId, business.name);
  };

  const handleDeclineSubmit = () => {
    if (!decliningReservation) return;
    setIsProcessing(true);
    const finalReason = declineReason === "Other" ? (customReason.trim() || "Table unavailable") : declineReason;
    declineBooking(decliningReservation.id, finalReason, business.name);
    setIsProcessing(false);
    setDecliningReservation(null);
    setCustomReason("");
    setDeclineReason("Fully booked at this hour");
  };

  const DECLINE_OPTIONS = [
    "Fully booked at this hour",
    "Closed for private event",
    "Cannot accommodate party size",
    "Kitchen closing / limited capacity",
    "Other",
  ];

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      {/* Back to dashboard */}
      <Link
        href={`/business/dashboard/business/${business.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to {business.name}
      </Link>

      {/* Header */}
      <div className="mt-6 border-b border-outline-variant pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Business Management
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-xs text-on-surface-variant font-medium">Reservations</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-on-surface">Manage reservations</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review incoming table requests, confirm bookings, and manage your restaurant guestbook.
        </p>

        {/* Tab Navigation */}
        <div className="mt-8 flex border-b border-outline-variant">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
              activeTab === "pending"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Pending Requests
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {pending.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("confirmed")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
              activeTab === "confirmed"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Confirmed Bookings
            {confirmed.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {confirmed.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition-colors ${
              activeTab === "history"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Declined & Cancelled
            {history.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="mt-8">
        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <div>
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-secondary">
                  check_circle
                </span>
                <h2 className="mt-3 text-base font-bold text-on-surface">All caught up!</h2>
                <p className="mt-1 text-xs">
                  There are no pending table reservation requests for {business.name}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between gap-5 rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm transition-all sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary">
                          {res.customerName ? res.customerName[0] : "G"}
                        </span>
                        <h3 className="font-bold text-on-surface text-base">
                          {res.customerName || `Guest (${res.customerId})`}
                        </h3>
                        <span className="rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          Pending your confirmation
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs text-on-surface">
                        <div>
                          <p className="text-on-surface-variant font-medium">Date & Time</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {new Date(`${res.date}T12:00:00`).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at {res.time}
                          </p>
                        </div>

                        <div>
                          <p className="text-on-surface-variant font-medium">Party Size</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {res.partySize} {res.partySize === 1 ? "guest" : "guests"}
                          </p>
                        </div>

                        <div>
                          <p className="text-on-surface-variant font-medium">Contact Phone</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {res.customerPhone || "Not provided"}
                          </p>
                        </div>
                      </div>

                      {res.specialRequest && (
                        <div className="mt-3 rounded-xl bg-white border border-outline-variant/60 p-3 text-xs">
                          <p className="font-bold text-secondary">Special Guest Request:</p>
                          <p className="mt-0.5 text-on-surface italic">&ldquo;{res.specialRequest}&rdquo;</p>
                        </div>
                      )}

                      <p className="mt-3 text-[11px] text-on-surface-variant">
                        Request ID: <span className="font-mono">{res.id}</span> · Requested on{" "}
                        {new Date(res.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 flex-row sm:flex-col gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleConfirm(res.id)}
                        className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        Confirm booking
                      </button>
                      <button
                        type="button"
                        onClick={() => setDecliningReservation(res)}
                        className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CONFIRMED TAB */}
        {activeTab === "confirmed" && (
          <div>
            {confirmed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline">
                  event_seat
                </span>
                <h2 className="mt-3 text-base font-bold text-on-surface">No confirmed bookings yet</h2>
                <p className="mt-1 text-xs">
                  Accepted reservations will appear here so you can prepare tables for your guests.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {confirmed.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary">
                          {res.customerName ? res.customerName[0] : "G"}
                        </span>
                        <h3 className="font-bold text-on-surface text-sm sm:text-base">
                          {res.customerName || "Customer"}
                        </h3>
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          Confirmed
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-on-surface-variant">
                        <span>
                          <strong className="text-on-surface">Date:</strong>{" "}
                          {new Date(`${res.date}T12:00:00`).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          at {res.time}
                        </span>
                        <span>
                          <strong className="text-on-surface">Party:</strong> {res.partySize} guests
                        </span>
                        {res.customerPhone && (
                          <span>
                            <strong className="text-on-surface">Phone:</strong> {res.customerPhone}
                          </span>
                        )}
                      </div>

                      {res.specialRequest && (
                        <p className="mt-2 text-xs italic text-on-surface bg-surface-container-low p-2 rounded-lg">
                          &ldquo;{res.specialRequest}&rdquo;
                        </p>
                      )}

                      <p className="mt-2 text-[11px] text-on-surface-variant">
                        Booking ID: <span className="font-mono">{res.id}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB (DECLINED / CANCELLED) */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-outline">history</span>
                <h2 className="mt-3 text-base font-bold text-on-surface">No past inactive bookings</h2>
                <p className="mt-1 text-xs">Cancelled or declined bookings will be archived here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((res) => (
                  <div
                    key={res.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-on-surface text-sm sm:text-base">
                          {res.customerName || "Customer"}
                        </h3>
                        {res.status === "declined" ? (
                          <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                            Declined by you
                          </span>
                        ) : (
                          <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-bold text-on-surface-variant">
                            Cancelled by guest
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-on-surface-variant">
                        {new Date(`${res.date}T12:00:00`).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {res.time} · {res.partySize} guests
                      </p>

                      {res.declineReason && (
                        <p className="mt-2 text-xs text-red-700 bg-red-50 p-2 rounded-lg">
                          Decline reason: {res.declineReason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decline Confirmation Modal */}
      {decliningReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Decline reservation request?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              The customer will be notified that this booking could not be accommodated.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary">
                Select reason
              </label>
              <div className="space-y-2">
                {DECLINE_OPTIONS.map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
                      declineReason === opt
                        ? "border-primary bg-primary-container/20 text-on-surface font-semibold"
                        : "border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <input
                      type="radio"
                      name="declineReason"
                      value={opt}
                      checked={declineReason === opt}
                      onChange={() => setDeclineReason(opt)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>

              {declineReason === "Other" && (
                <div>
                  <textarea
                    rows={2}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter reason for declining..."
                    className="mt-2 w-full rounded-xl border border-outline-variant p-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => setDecliningReservation(null)}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={isProcessing}
                className="h-10 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? "Declining..." : "Decline booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
