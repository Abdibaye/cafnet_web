"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getManagedBusiness } from "@/lib/api/businesses";
import {
  listBusinessReservations,
  confirmReservation,
  declineReservation,
  completeReservation,
} from "@/lib/api/reservations";
import {
  reservationToViewModel,
  type BusinessReservationViewModel,
  type UiReservationStatus,
} from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Business } from "@/lib/api/types";
import { getBusinessById } from "@/data/mockBusinesses";

type TabType = "pending" | "confirmed" | "completed" | "declined" | "cancelled" | "all";

export default function BusinessReservationsPage({ businessId }: { businessId: string }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessReservations, setBusinessReservations] = useState<BusinessReservationViewModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [viewingReservation, setViewingReservation] = useState<BusinessReservationViewModel | null>(null);
  const [confirmingReservation, setConfirmingReservation] = useState<BusinessReservationViewModel | null>(null);
  const [decliningReservation, setDecliningReservation] = useState<BusinessReservationViewModel | null>(null);
  const [completingReservation, setCompletingReservation] = useState<BusinessReservationViewModel | null>(null);

  const [declineReason, setDeclineReason] = useState("Fully booked at this hour");
  const [customReason, setCustomReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage(null);
    try {
      const [biz, rawReservations] = await Promise.all([
        getManagedBusiness(businessId),
        listBusinessReservations(businessId),
      ]);
      setBusiness(biz);
      setBusinessReservations(rawReservations.map(reservationToViewModel));
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorStatus(err.status);
        setErrorMessage(err.message);
      } else {
        const mock = getBusinessById(businessId);
        if (mock) {
          setBusiness({
            id: Number(businessId),
            name: mock.name,
            category: mock.category as any,
            description: mock.description,
            reservation_available: mock.reservationAvailable,
            claim_status: mock.claimStatus === "claimed" ? "CLAIMED" : "UNCLAIMED",
            verification_status: mock.verified ? "VERIFIED" : "UNVERIFIED",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Business);
          setBusinessReservations([]);
        } else {
          setErrorStatus(404);
          setErrorMessage("Business not found");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener("cafnet:reservations-updated", handleUpdate);
    return () => {
      window.removeEventListener("cafnet:reservations-updated", handleUpdate);
    };
  }, [loadData]);

  // Lifecycle Action Handlers
  const handleConfirmSubmit = async () => {
    if (!confirmingReservation || isProcessing) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await confirmReservation(businessId, confirmingReservation.id);
      const now = new Date().toISOString();
      setBusinessReservations((prev) =>
        prev.map((r) =>
          r.id === confirmingReservation.id
            ? { ...r, status: "confirmed", confirmedAt: now }
            : r
        )
      );
      if (viewingReservation?.id === confirmingReservation.id) {
        setViewingReservation((prev) =>
          prev ? { ...prev, status: "confirmed", confirmedAt: now } : null
        );
      }
      setConfirmingReservation(null);
      window.dispatchEvent(
        new CustomEvent("cafnet:reservations-updated", {
          detail: { businessId: Number(businessId) },
        })
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to confirm reservation. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineSubmit = async () => {
    if (!decliningReservation || isProcessing) return;
    const finalReason = declineReason === "Other" ? customReason.trim() : declineReason.trim();
    if (!finalReason) {
      setActionError("Please provide a reason for declining this reservation.");
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    try {
      await declineReservation(businessId, decliningReservation.id, finalReason);
      const now = new Date().toISOString();
      setBusinessReservations((prev) =>
        prev.map((r) =>
          r.id === decliningReservation.id
            ? { ...r, status: "declined", declinedAt: now, declineReason: finalReason }
            : r
        )
      );
      if (viewingReservation?.id === decliningReservation.id) {
        setViewingReservation((prev) =>
          prev ? { ...prev, status: "declined", declinedAt: now, declineReason: finalReason } : null
        );
      }
      setDecliningReservation(null);
      setCustomReason("");
      setDeclineReason("Fully booked at this hour");
      window.dispatchEvent(
        new CustomEvent("cafnet:reservations-updated", {
          detail: { businessId: Number(businessId) },
        })
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to decline reservation. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completingReservation || isProcessing) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await completeReservation(businessId, completingReservation.id);
      const now = new Date().toISOString();
      setBusinessReservations((prev) =>
        prev.map((r) =>
          r.id === completingReservation.id
            ? { ...r, status: "completed", completedAt: now }
            : r
        )
      );
      if (viewingReservation?.id === completingReservation.id) {
        setViewingReservation((prev) =>
          prev ? { ...prev, status: "completed", completedAt: now } : null
        );
      }
      setCompletingReservation(null);
      window.dispatchEvent(
        new CustomEvent("cafnet:reservations-updated", {
          detail: { businessId: Number(businessId) },
        })
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setActionError(err.message);
      } else {
        setActionError("Failed to mark reservation as completed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-on-surface-variant">
        Loading reservations...
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Not Managed</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
          You do not have management access for this business on Cafnet.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
        >
          Back to Business Center
        </Link>
      </div>
    );
  }

  if (errorStatus === 404 || !business) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">This business could not be found.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  // Feature gate: table reservations enabled for business
  if (!business.reservation_available) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-800">
          <span className="material-symbols-outlined text-3xl">event_busy</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Reservations not available</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-on-surface-variant">
          {business.name} does not have table reservations enabled.
        </p>
        <Link
          href={`/business/dashboard/business/${business.id}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
        >
          Back to business overview
        </Link>
      </div>
    );
  }

  const pending = businessReservations.filter((r) => r.status === "pending");
  const confirmed = businessReservations.filter((r) => r.status === "confirmed");
  const completed = businessReservations.filter((r) => r.status === "completed");
  const declined = businessReservations.filter((r) => r.status === "declined");
  const cancelled = businessReservations.filter((r) => r.status === "cancelled");

  const tabItems: Record<TabType, BusinessReservationViewModel[]> = {
    pending,
    confirmed,
    completed,
    declined,
    cancelled,
    all: businessReservations,
  };

  const displayedReservations = tabItems[activeTab];

  const DECLINE_OPTIONS = [
    "Fully booked at this hour",
    "Closed for private event",
    "Unable to accommodate party size",
    "Kitchen closing / limited capacity",
    "Other",
  ];

  const renderBadge = (status: UiReservationStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            Pending confirmation
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            Confirmed
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-container border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-[13px]">verified</span>
            Visit completed
          </span>
        );
      case "declined":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-bold text-red-700">
            <span className="material-symbols-outlined text-[13px]">cancel</span>
            Declined
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">block</span>
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      {/* Navigation */}
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
          Review incoming table requests, confirm bookings, and mark visits completed to enable verified reviews.
        </p>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-1 border-b border-outline-variant">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
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
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "confirmed"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Confirmed
            {confirmed.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {confirmed.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "completed"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Completed Visits
            {completed.length > 0 && (
              <span className="rounded-full bg-primary-container px-2 py-0.5 text-xs font-bold text-primary">
                {completed.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("declined")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "declined"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Declined
            {declined.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {declined.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cancelled")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "cancelled"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Cancelled
            {cancelled.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {cancelled.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All
            {businessReservations.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {businessReservations.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-8">
        {businessReservations.length === 0 ? (
          /* Global Empty State */
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline">event_seat</span>
            <h2 className="mt-3 text-base font-bold text-on-surface">No reservations yet.</h2>
            <p className="mt-1 text-xs">
              When your customers request tables, they will appear here.
            </p>
          </div>
        ) : displayedReservations.length === 0 ? (
          /* Tab Specific Empty State */
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline">
              {activeTab === "pending"
                ? "check_circle"
                : activeTab === "confirmed"
                ? "event_available"
                : activeTab === "completed"
                ? "verified"
                : "inbox"}
            </span>
            <h2 className="mt-3 text-base font-bold text-on-surface">
              {activeTab === "pending"
                ? "All caught up!"
                : activeTab === "confirmed"
                ? "No confirmed bookings"
                : activeTab === "completed"
                ? "No completed visits yet"
                : activeTab === "declined"
                ? "No declined requests"
                : "No cancelled bookings"}
            </h2>
            <p className="mt-1 text-xs">
              {activeTab === "pending"
                ? `There are no pending table reservation requests for ${business.name}.`
                : activeTab === "confirmed"
                ? "Accepted reservations will appear here so you can prepare tables for your guests."
                : activeTab === "completed"
                ? "When guests finish their visit, mark them as completed to allow verified reviews."
                : activeTab === "declined"
                ? "Requests you decline will be archived here."
                : "Bookings cancelled by guests will be listed here."}
            </p>
          </div>
        ) : (
          /* Cards List (Mobile-first card hierarchy) */
          <div className="space-y-4">
            {displayedReservations.map((res) => {
              const formattedDate = new Date(`${res.date}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });

              const isPending = res.status === "pending";
              const isConfirmed = res.status === "confirmed";
              const isCompleted = res.status === "completed";
              const isDeclined = res.status === "declined";

              return (
                <div
                  key={res.id}
                  className={`flex flex-col justify-between gap-5 rounded-2xl border p-5 sm:p-6 shadow-sm transition-all sm:flex-row sm:items-start ${
                    isPending
                      ? "border-amber-200 bg-amber-50/40"
                      : isCompleted
                      ? "border-primary/20 bg-primary-container/10"
                      : "border-outline-variant bg-white"
                  }`}
                >
                  {/* Card Content Hierarchy */}
                  <div className="min-w-0 flex-1">
                    {/* WHO + STATUS */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-full bg-primary-container text-xs font-bold text-primary">
                        {res.customerName ? res.customerName[0].toUpperCase() : "G"}
                      </span>
                      <div>
                        <h3 className="font-bold text-on-surface text-base leading-tight">
                          {res.customerName || `Guest (${res.customerId})`}
                        </h3>
                        {res.customerPhone && (
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            <span className="material-symbols-outlined text-[13px] align-middle mr-0.5 text-secondary">
                              phone
                            </span>
                            {res.customerPhone}
                          </p>
                        )}
                      </div>
                      <div className="ml-auto sm:ml-2">{renderBadge(res.status)}</div>
                    </div>

                    {/* WHEN + HOW MANY */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl bg-surface-container-low p-3.5 text-xs text-on-surface">
                      <div>
                        <p className="text-on-surface-variant font-medium">When</p>
                        <p className="font-bold text-sm text-on-surface mt-0.5">
                          {formattedDate}
                        </p>
                        <p className="text-xs text-secondary font-semibold">{res.time}</p>
                      </div>

                      <div>
                        <p className="text-on-surface-variant font-medium">Party Size</p>
                        <p className="font-bold text-sm text-on-surface mt-0.5">
                          {res.partySize} {res.partySize === 1 ? "guest" : "guests"}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-on-surface-variant font-medium">Booking ID</p>
                        <p className="font-mono text-xs font-semibold text-primary mt-0.5">
                          {res.id}
                        </p>
                      </div>
                    </div>

                    {/* SPECIAL REQUEST */}
                    {res.specialRequest && (
                      <div className="mt-3 rounded-xl bg-amber-50/60 border border-amber-200/80 p-3 text-xs">
                        <p className="font-bold text-amber-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px]">format_quote</span>
                          Special Guest Request:
                        </p>
                        <p className="mt-1 text-on-surface italic">&ldquo;{res.specialRequest}&rdquo;</p>
                      </div>
                    )}

                    {/* DECLINE REASON CALLOUT */}
                    {isDeclined && res.declineReason && (
                      <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-900">
                        <p className="font-bold">Decline reason:</p>
                        <p className="mt-0.5 font-medium">{res.declineReason}</p>
                      </div>
                    )}

                    {/* COMPLETED REVIEW ELIGIBILITY CALLOUT */}
                    {isCompleted && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-900">
                        <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                        <span>Visit completed. Customer is eligible to leave a verified review.</span>
                      </div>
                    )}

                    {/* METADATA TIMESTAMPS */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                      <span>
                        Requested:{" "}
                        {new Date(res.createdAt).toLocaleString("en-US", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      {res.confirmedAt && (
                        <span>
                          Confirmed:{" "}
                          {new Date(res.confirmedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      {res.completedAt && (
                        <span>
                          Completed:{" "}
                          {new Date(res.completedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                      {res.declinedAt && (
                        <span>
                          Declined:{" "}
                          {new Date(res.declinedAt).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex shrink-0 flex-row sm:flex-col gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-outline-variant/60">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setConfirmingReservation(res);
                          }}
                          className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[17px]">check</span>
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActionError(null);
                            setDecliningReservation(res);
                          }}
                          className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-4 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[17px]">close</span>
                          Decline
                        </button>
                      </>
                    )}

                    {isConfirmed && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          setCompletingReservation(res);
                        }}
                        className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm hover:bg-[#0f46b8] transition-colors"
                      >
                        <span className="material-symbols-outlined text-[17px]">check_circle</span>
                        Mark visit completed
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewingReservation(res)}
                      className="flex-1 sm:flex-initial inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-3.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
                    >
                      <span className="material-symbols-outlined text-[17px] text-secondary">info</span>
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CONFIRM MODAL */}
      {/* ------------------------------------------------------------- */}
      {confirmingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <span className="material-symbols-outlined text-[20px]">event_available</span>
              </span>
              <h3 className="text-lg font-bold text-on-surface">Confirm table reservation?</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-on-surface-variant">
              The customer will receive confirmation that their table has been booked.
            </p>

            {/* Summary card */}
            <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Guest:</span>
                <span className="font-bold text-on-surface">
                  {confirmingReservation.customerName || "Customer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Date & Time:</span>
                <span className="font-semibold text-on-surface">
                  {confirmingReservation.date} at {confirmingReservation.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Party Size:</span>
                <span className="font-semibold text-on-surface">
                  {confirmingReservation.partySize} guests
                </span>
              </div>
              {confirmingReservation.customerPhone && (
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Phone:</span>
                  <span className="font-semibold text-on-surface">{confirmingReservation.customerPhone}</span>
                </div>
              )}
            </div>

            {actionError && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg">
                {actionError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => setConfirmingReservation(null)}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={isProcessing}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">check</span>
                {isProcessing ? "Confirming..." : "Confirm booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. DECLINE MODAL */}
      {/* ------------------------------------------------------------- */}
      {decliningReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-red-100 text-red-800">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </span>
              <h3 className="text-lg font-bold text-on-surface">Decline reservation request?</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-on-surface-variant">
              The customer will be notified that this booking could not be accommodated. A decline reason is required.
            </p>

            <div className="mt-4 space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary">
                Select reason
              </label>
              <div className="space-y-1.5">
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
                    placeholder="Enter specific reason for declining..."
                    className="mt-2 w-full rounded-xl border border-outline-variant p-3 text-xs outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            {actionError && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg">
                {actionError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => {
                  setDecliningReservation(null);
                  setActionError(null);
                }}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={isProcessing || (declineReason === "Other" && !customReason.trim())}
                className="h-10 rounded-xl bg-red-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {isProcessing ? "Declining..." : "Decline booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. COMPLETE VISIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {completingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary-container text-primary">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </span>
              <h3 className="text-lg font-bold text-on-surface">Mark visit completed?</h3>
            </div>
            <p className="mt-2 text-xs leading-5 text-on-surface-variant font-medium">
              Mark this reservation as completed? This will make the customer eligible to leave a verified review.
            </p>

            {/* Summary card */}
            <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Guest:</span>
                <span className="font-bold text-on-surface">
                  {completingReservation.customerName || "Customer"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Date & Time:</span>
                <span className="font-semibold text-on-surface">
                  {completingReservation.date} at {completingReservation.time}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant font-medium">Party Size:</span>
                <span className="font-semibold text-on-surface">
                  {completingReservation.partySize} guests
                </span>
              </div>
            </div>

            {actionError && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg">
                {actionError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => {
                  setCompletingReservation(null);
                  setActionError(null);
                }}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCompleteSubmit}
                disabled={isProcessing}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f46b8] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">verified</span>
                {isProcessing ? "Marking..." : "Mark as completed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DETAIL INSPECTION MODAL */}
      {/* ------------------------------------------------------------- */}
      {viewingReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Reservation Detail
                </span>
                <h3 className="text-lg font-bold text-on-surface mt-0.5">
                  {viewingReservation.customerName || "Customer"} · {viewingReservation.partySize} guests
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingReservation(null)}
                className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Status</span>
                <div>{renderBadge(viewingReservation.status)}</div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Reservation ID</span>
                <span className="font-mono font-semibold text-primary">{viewingReservation.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Customer Phone</span>
                <span className="font-semibold text-on-surface">
                  {viewingReservation.customerPhone || "Not provided"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Date & Time</span>
                <span className="font-semibold text-on-surface">
                  {viewingReservation.date} at {viewingReservation.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant font-medium">Party Size</span>
                <span className="font-semibold text-on-surface">
                  {viewingReservation.partySize} {viewingReservation.partySize === 1 ? "guest" : "guests"}
                </span>
              </div>

              {viewingReservation.specialRequest && (
                <div className="rounded-xl bg-surface-container-low p-3">
                  <p className="font-bold text-secondary">Special Request:</p>
                  <p className="mt-1 text-on-surface italic">&ldquo;{viewingReservation.specialRequest}&rdquo;</p>
                </div>
              )}

              {viewingReservation.declineReason && (
                <div className="rounded-xl bg-red-50 p-3 text-red-900 border border-red-200">
                  <p className="font-bold">Decline Reason:</p>
                  <p className="mt-1">{viewingReservation.declineReason}</p>
                </div>
              )}

              <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3 space-y-1.5 text-[11px] text-on-surface-variant">
                <p className="font-bold text-on-surface text-xs mb-1">Audit Timestamps</p>
                <p>Created: {new Date(viewingReservation.createdAt).toLocaleString("en-US")}</p>
                {viewingReservation.confirmedAt && (
                  <p>Confirmed: {new Date(viewingReservation.confirmedAt).toLocaleString("en-US")}</p>
                )}
                {viewingReservation.completedAt && (
                  <p>Completed: {new Date(viewingReservation.completedAt).toLocaleString("en-US")}</p>
                )}
                {viewingReservation.declinedAt && (
                  <p>Declined: {new Date(viewingReservation.declinedAt).toLocaleString("en-US")}</p>
                )}
                {viewingReservation.cancelledAt && (
                  <p>Cancelled: {new Date(viewingReservation.cancelledAt).toLocaleString("en-US")}</p>
                )}
                {viewingReservation.reviewedBy && (
                  <p>Reviewed by: {viewingReservation.reviewedBy}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-outline-variant pt-4">
              {viewingReservation.status === "pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingReservation(viewingReservation);
                    }}
                    className="h-10 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Confirm booking
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecliningReservation(viewingReservation);
                    }}
                    className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Decline
                  </button>
                </>
              )}

              {viewingReservation.status === "confirmed" && (
                <button
                  type="button"
                  onClick={() => {
                    setCompletingReservation(viewingReservation);
                  }}
                  className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-[#0f46b8]"
                >
                  Mark visit completed
                </button>
              )}

              <button
                type="button"
                onClick={() => setViewingReservation(null)}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
