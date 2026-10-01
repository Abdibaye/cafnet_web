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

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      <Link href="/business/dashboard" className="text-sm font-semibold text-primary">
        ← Business Center
      </Link>

      {/* Alert Banner for Pending Reservation Requests */}
      {isReservable && pendingReservations.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <span className="material-symbols-outlined text-2xl">notifications_active</span>
            </span>
            <div>
              <h2 className="text-sm font-bold text-amber-950">
                {pendingReservations.length} reservation {pendingReservations.length === 1 ? "request needs" : "requests need"} your attention.
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Guests are waiting for your response to book tables.
              </p>
            </div>
          </div>
          <Link
            href={`/business/dashboard/business/${business.id}/reservations`}
            className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-800 px-4 text-xs font-bold text-white shadow-sm hover:bg-amber-900 transition-colors"
          >
            Review requests
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mt-8 flex flex-col gap-5 border-b border-outline-variant pb-7 sm:flex-row sm:items-center">
        <img src={business.images[0]} alt="" className="size-24 rounded-xl object-cover" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Managed by you
          </p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">{business.name}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            {business.cuisine} · {business.location}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/business/${business.id}`}
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          View public profile
        </Link>

        <Link
          href={`/business/dashboard/business/${business.id}/edit`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            edit
          </span>
          Edit listing
        </Link>

        {/* Manage Reservations Button */}
        {isReservable && (
          <Link
            href={`/business/dashboard/business/${business.id}/reservations`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
              event_seat
            </span>
            Manage reservations
            {pendingReservations.length > 0 ? (
              <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                {pendingReservations.length} pending
              </span>
            ) : confirmedReservations.length > 0 ? (
              <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
                {confirmedReservations.length} confirmed
              </span>
            ) : null}
          </Link>
        )}

        <Link
          href={`/business/dashboard/business/${business.id}/menu`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            restaurant_menu
          </span>
          Manage menu
          {menuSummary.itemCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
              {menuSummary.itemCount} items
            </span>
          )}
        </Link>

        <Link
          href={`/business/dashboard/business/${business.id}/updates`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
            campaign
          </span>
          Manage updates
          {activeUpdatesCount > 0 && (
            <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
              {activeUpdatesCount}
            </span>
          )}
        </Link>

        {lastUpdated && (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
              schedule
            </span>
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {/* Your listing section */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-on-surface">Your listing</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Manage the information customers see about your business
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Basic information</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Name, description, and category
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                check_circle
              </span>
            </div>
          </article>

          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Contact & location</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Phone, address, website, and price range
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                check_circle
              </span>
            </div>
          </article>

          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Opening hours</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Set your regular business hours
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                check_circle
              </span>
            </div>
          </article>

          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Features</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Customer-facing attributes and tags
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                check_circle
              </span>
            </div>
          </article>
        </div>

        {/* Reservations Summary Card */}
        {isReservable && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-on-surface">Table reservations</h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Accept or decline guest table reservations, and mark visits completed.
            </p>
            <div className="mt-4">
              <Link
                href={`/business/dashboard/business/${business.id}/reservations`}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                  event_seat
                </span>
                Manage reservations
                {pendingReservations.length > 0 ? (
                  <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-300">
                    {pendingReservations.length} pending requests
                  </span>
                ) : confirmedReservations.length > 0 ? (
                  <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
                    {confirmedReservations.length} confirmed bookings
                  </span>
                ) : (
                  <span className="ml-1 text-xs text-on-surface-variant font-normal">No active requests</span>
                )}
              </Link>
            </div>
          </div>
        )}

        {/* Customer Information (Read-only) */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-on-surface">Customer information</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            The following information is managed by Cafnet and cannot be edited:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
              <div>
                <p className="font-semibold text-on-surface">Rating & reviews</p>
                <p className="text-sm text-on-surface-variant">
                  {business.rating} · {business.reviewCount} reviews
                </p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                lock
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
              <div>
                <p className="font-semibold text-on-surface">Verified status</p>
                <p className="text-sm text-on-surface-variant">
                  {business.verified ? "Verified" : "Not verified"}
                </p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                lock
              </span>
            </div>
          </div>
        </div>

        {/* Menu link */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-on-surface">Menu</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Manage the categories, dishes, and prices customers see on your profile.
          </p>
          <div className="mt-4">
            <Link
              href={`/business/dashboard/business/${business.id}/menu`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                restaurant_menu
              </span>
              Manage menu
              {menuSummary.hasMenu ? (
                <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
                  {menuSummary.categoryCount}{" "}
                  {menuSummary.categoryCount === 1 ? "category" : "categories"} ·{" "}
                  {menuSummary.itemCount} items
                </span>
              ) : (
                <span className="ml-1 text-xs text-on-surface-variant font-normal">Not setup yet</span>
              )}
            </Link>
          </div>
        </div>

        {/* Updates link */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-on-surface">Updates</h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Share new menus, offers, events, and announcements with customers.
          </p>
          <div className="mt-4">
            <Link
              href={`/business/dashboard/business/${business.id}/updates`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
                campaign
              </span>
              Manage updates
              {activeUpdatesCount > 0 && (
                <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">
                  {activeUpdatesCount} active
                </span>
              )}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
