"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { getManagedBusiness, getBusinessHours, getBusinessImages } from "@/lib/api/businesses";
import { getBusinessMenu } from "@/lib/api/menus";
import { getBusinessUpdates } from "@/lib/api/updates";
import { listBusinessReservations } from "@/lib/api/reservations";
import {
  businessToViewModel,
  computeMenuSummary,
  reservationToViewModel,
  type BusinessProfileViewModel,
  type MenuSummaryViewModel,
  type BusinessReservationViewModel,
} from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";

export default function ManagedBusinessPage({ businessId }: { businessId: string }) {
  const { ready, getManagedBusiness: getManagedFromContext } = useBusinessOwner();
  const [businessData, setBusinessData] = useState<BusinessProfileViewModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [activeUpdatesCount, setActiveUpdatesCount] = useState(0);
  const [businessReservations, setBusinessReservations] = useState<BusinessReservationViewModel[]>([]);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorStatus(null);
      try {
        const [b, hours, images, menuData, updatesData, reservationsData] = await Promise.all([
          getManagedBusiness(businessId),
          getBusinessHours(businessId).catch(() => []),
          getBusinessImages(businessId).catch(() => []),
          getBusinessMenu(businessId).catch(() => null),
          getBusinessUpdates(businessId, true).catch(() => []),
          listBusinessReservations(businessId).catch(() => []),
        ]);
        if (!cancelled) {
          setBusinessData(businessToViewModel(b, hours, images));
          setMenuSummary(computeMenuSummary(menuData));
          setBusinessReservations(reservationsData.map(reservationToViewModel));
          const now = new Date();
          const activeCount = updatesData.filter((u) => {
            if (u.status !== "PUBLISHED") return false;
            if (u.expires_at && new Date(u.expires_at) <= now) return false;
            return true;
          }).length;
          setActiveUpdatesCount(activeCount);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setErrorStatus(err.status);
          } else {
            setErrorStatus(404);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const [menuSummary, setMenuSummary] = useState<MenuSummaryViewModel>({
    categoryCount: 0,
    itemCount: 0,
    hasMenu: false,
  });

  useEffect(() => {
    const handleMenuUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ businessId?: number }>;
      if (!customEvent.detail?.businessId || customEvent.detail.businessId === Number(businessId)) {
        getBusinessMenu(businessId)
          .then((raw) => setMenuSummary(computeMenuSummary(raw)))
          .catch(() => {});
      }
    };

    const handleReservationUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ businessId?: number }>;
      if (!customEvent.detail?.businessId || customEvent.detail.businessId === Number(businessId)) {
        listBusinessReservations(businessId)
          .then((res) => setBusinessReservations(res.map(reservationToViewModel)))
          .catch(() => {});
      }
    };

    window.addEventListener("cafnet:menu-updated", handleMenuUpdate);
    window.addEventListener("cafnet:reservations-updated", handleReservationUpdate);

    return () => {
      window.removeEventListener("cafnet:menu-updated", handleMenuUpdate);
      window.removeEventListener("cafnet:reservations-updated", handleReservationUpdate);
    };
  }, [businessId]);

  if (loading || !ready) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-on-surface-variant">
        Loading business management details...
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Not Managed</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          You do not have management access for this business on Cafnet.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link href="/business/dashboard" className="inline-flex text-sm font-semibold text-primary">
            Business Center
          </Link>
          <Link href={`/business/claim?id=${businessId}`} className="inline-flex text-sm font-semibold text-on-surface-variant hover:text-primary">
            Claim this business
          </Link>
        </div>
      </div>
    );
  }

  if (errorStatus === 404 || !businessData) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">This business may no longer be available.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Business Center
        </Link>
      </div>
    );
  }

  const business = businessData;
  const managedFromContext = getManagedFromContext?.(Number(businessId));
  const lastUpdated = managedFromContext?.editableData?.updatedAt
    ? new Date(managedFromContext.editableData.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : undefined;

  const isReservable = Boolean(business.reservationAvailable);
  const pendingReservations = isReservable ? businessReservations.filter((r) => r.status === "pending") : [];
  const confirmedReservations = isReservable ? businessReservations.filter((r) => r.status === "confirmed") : [];

  const coverUrl =
    business.cover_image ||
    (business.images && business.images.length > 0 && business.images[0] !== "/images/cafnet-placeholder.svg"
      ? business.images[0]
      : null);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      {/* Back Link */}
      <Link
        href="/business/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-[#0f46b8]"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          arrow_back
        </span>
        Business Center
      </Link>

      {/* Alert Banner for Pending Reservation Requests */}
      {isReservable && pendingReservations.length > 0 && (
        <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                {pendingReservations.length} reservation {pendingReservations.length === 1 ? "request needs" : "requests need"} your attention.
              </h2>
              <p className="mt-0.5 text-xs text-amber-800">
                Guests are waiting for your response to book tables.
              </p>
            </div>
          </div>
          <Link
            href={`/business/dashboard/business/${business.id}/reservations`}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-800 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-amber-900"
          >
            Review requests
          </Link>
        </div>
      )}

      {/* Header: Cover Image + Business Name & Meta */}
      <div className="mt-8 flex flex-col gap-5 border-b border-outline-variant pb-7 sm:flex-row sm:items-center">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-outline-variant/60 bg-surface-container-low shadow-xs sm:h-24 sm:w-32">
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-outline/60">
              <span className="material-symbols-outlined text-3xl sm:text-4xl" aria-hidden="true">
                storefront
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold text-on-surface sm:text-3xl">
            {business.name}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {business.cuisine} · {business.location}
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-on-surface-variant/80">
              Last updated {lastUpdated}
            </p>
          )}
        </div>
      </div>

      {/* Organized Action Buttons - Ordered by Usage Frequency */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {/* 1. Edit Listing (Primary Management Action) */}
        <Link
          href={`/business/dashboard/business/${business.id}/edit`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#0f46b8] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            edit
          </span>
          Edit listing
        </Link>

        {/* 2. Manage Menu (High Daily/Weekly Usage) */}
        <Link
          href={`/business/dashboard/business/${business.id}/menu`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface shadow-xs transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[19px] text-primary" aria-hidden="true">
            restaurant_menu
          </span>
          Manage menu
          {menuSummary.itemCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {menuSummary.itemCount} {menuSummary.itemCount === 1 ? "item" : "items"}
            </span>
          )}
        </Link>

        {/* 3. Manage Reservations (When Enabled) */}
        {isReservable && (
          <Link
            href={`/business/dashboard/business/${business.id}/reservations`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface shadow-xs transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[19px] text-primary" aria-hidden="true">
              event_seat
            </span>
            Manage reservations
            {pendingReservations.length > 0 ? (
              <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {pendingReservations.length} pending
              </span>
            ) : confirmedReservations.length > 0 ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {confirmedReservations.length} confirmed
              </span>
            ) : null}
          </Link>
        )}

        {/* 4. Manage Updates & Announcements */}
        <Link
          href={`/business/dashboard/business/${business.id}/updates`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface shadow-xs transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[19px] text-primary" aria-hidden="true">
            campaign
          </span>
          Manage updates
          {activeUpdatesCount > 0 && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {activeUpdatesCount} active
            </span>
          )}
        </Link>

        {/* 5. View Public Profile (Preview) */}
        <Link
          href={`/business/${business.id}`}
          target="_blank"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface-variant shadow-xs transition-all hover:border-primary/40 hover:text-primary active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            visibility
          </span>
          View public profile
        </Link>
      </div>

      {/* Management Hub Grid */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-on-surface">Management Hub</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Quickly access and update customer-facing areas of your business
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Card 1: Listing & Profile Information */}
          <Link
            href={`/business/dashboard/business/${business.id}/edit`}
            className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">edit_note</span>
                </span>
                <span className="text-xs font-semibold text-primary group-hover:underline">
                  Edit &rarr;
                </span>
              </div>
              <h3 className="mt-4 font-bold text-on-surface">Listing details</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant">
                Business name, phone, opening hours, location, and photos.
              </p>
            </div>
            <div className="mt-5 border-t border-outline-variant/60 pt-3 text-xs text-on-surface-variant">
              Phone: {business.phone || "Not set"} · Hours: {business.openingHours || "Configured"}
            </div>
          </Link>

          {/* Card 2: Menu Management */}
          <Link
            href={`/business/dashboard/business/${business.id}/menu`}
            className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
                </span>
                <span className="text-xs font-semibold text-primary group-hover:underline">
                  Manage &rarr;
                </span>
              </div>
              <h3 className="mt-4 font-bold text-on-surface">Menu & pricing</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant">
                Categories, dishes, items, prices, and item availability.
              </p>
            </div>
            <div className="mt-5 border-t border-outline-variant/60 pt-3 text-xs text-on-surface-variant">
              {menuSummary.hasMenu
                ? `${menuSummary.categoryCount} categories · ${menuSummary.itemCount} items listed`
                : "No menu items yet · Setup menu"}
            </div>
          </Link>

          {/* Card 3: Reservations (if enabled) */}
          {isReservable && (
            <Link
              href={`/business/dashboard/business/${business.id}/reservations`}
              className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <span className="material-symbols-outlined text-2xl">event_seat</span>
                  </span>
                  <span className="text-xs font-semibold text-primary group-hover:underline">
                    Manage &rarr;
                  </span>
                </div>
                <h3 className="mt-4 font-bold text-on-surface">Table reservations</h3>
                <p className="mt-1.5 text-sm text-on-surface-variant">
                  Review booking requests, confirm guests, and track seating status.
                </p>
              </div>
              <div className="mt-5 border-t border-outline-variant/60 pt-3 text-xs text-on-surface-variant">
                {pendingReservations.length > 0 ? (
                  <span className="font-semibold text-amber-700">
                    {pendingReservations.length} pending requests waiting
                  </span>
                ) : confirmedReservations.length > 0 ? (
                  <span className="text-primary">
                    {confirmedReservations.length} confirmed bookings
                  </span>
                ) : (
                  "All caught up · No active requests"
                )}
              </div>
            </Link>
          )}

          {/* Card 4: Updates & Announcements */}
          <Link
            href={`/business/dashboard/business/${business.id}/updates`}
            className="group flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <span className="material-symbols-outlined text-2xl">campaign</span>
                </span>
                <span className="text-xs font-semibold text-primary group-hover:underline">
                  Manage &rarr;
                </span>
              </div>
              <h3 className="mt-4 font-bold text-on-surface">Updates & offers</h3>
              <p className="mt-1.5 text-sm text-on-surface-variant">
                Publish special offers, announcements, and events to customers.
              </p>
            </div>
            <div className="mt-5 border-t border-outline-variant/60 pt-3 text-xs text-on-surface-variant">
              {activeUpdatesCount > 0
                ? `${activeUpdatesCount} active public announcements`
                : "No active announcements · Share an update"}
            </div>
          </Link>
        </div>

        {/* Read-only verification & review status */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-2xl border border-outline-variant/60 bg-white p-4">
            <div>
              <p className="text-xs text-on-surface-variant">Rating & Reviews</p>
              <p className="mt-0.5 text-sm font-bold text-on-surface">
                ★ {business.rating} · {business.reviewCount} customer reviews
              </p>
            </div>
            <span className="material-symbols-outlined text-xl text-outline/60" aria-hidden="true">
              reviews
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-outline-variant/60 bg-white p-4">
            <div>
              <p className="text-xs text-on-surface-variant">Verification Status</p>
              <p className="mt-0.5 text-sm font-bold text-on-surface">
                {business.verified ? "Verified listing" : "Standard listing"}
              </p>
            </div>
            <span
              className={`material-symbols-outlined text-xl ${
                business.verified ? "text-primary" : "text-outline/60"
              }`}
              aria-hidden="true"
            >
              {business.verified ? "verified" : "info"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
