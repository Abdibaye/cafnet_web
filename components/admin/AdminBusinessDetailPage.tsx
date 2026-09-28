"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBusinessById } from "@/data/mockBusinesses";
import { getManagedBusiness } from "@/data/ownerManagedBusinessStorage";
import { setBusinessVerification } from "@/data/adminStorage";
import { getMenuSummary } from "@/data/menuStorage";
import { getUpdatesByBusiness } from "@/data/businessUpdateStorage";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminBusinessDetailPage({ businessId }: { businessId: string }) {
  const numId = Number(businessId);
  const { showToast } = useCustomer();
  const [business, setBusiness] = useState(() => getBusinessById(numId));
  const [isConfirmingVerification, setIsConfirmingVerification] = useState(false);

  const reload = () => {
    setBusiness(getBusinessById(numId));
  };

  useEffect(() => {
    reload();
    const handleEvents = () => reload();
    window.addEventListener("cafnet:admin-updated", handleEvents);
    window.addEventListener("cafnet:managed-businesses-updated", handleEvents);

    return () => {
      window.removeEventListener("cafnet:admin-updated", handleEvents);
      window.removeEventListener("cafnet:managed-businesses-updated", handleEvents);
    };
  }, [numId]);

  if (!business) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          No business exists with ID #{businessId}.
        </p>
        <Link
          href="/admin/businesses"
          className="mt-6 inline-flex text-sm font-semibold text-primary"
        >
          ← Return to businesses list
        </Link>
      </div>
    );
  }

  const isManaged = Boolean(getManagedBusiness(business.id) || business.claimStatus === "claimed");
  const menuSummary = getMenuSummary(business.id);
  const updates = getUpdatesByBusiness(business.id);

  const handleToggleVerification = () => {
    const nextState = !business.verified;
    setBusinessVerification(business.id, nextState);
    showToast(nextState ? "Verification badge granted" : "Verification badge revoked");
    setIsConfirmingVerification(false);
    reload();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/businesses"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to businesses
        </Link>
      </div>

      {/* Header Info */}
      <div className="flex flex-col gap-5 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {business.images && business.images.length > 0 && (
            <img
              src={business.images[0]}
              alt=""
              className="size-20 shrink-0 rounded-2xl object-cover"
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface">{business.name}</h1>
              <span className="text-xs font-semibold text-on-surface-variant">
                (ID: #{business.id})
              </span>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              {business.category} · {business.cuisine} · {business.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${
                  isManaged
                    ? "bg-primary-container/50 text-primary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isManaged ? "check_circle" : "radio_button_unchecked"}
                </span>
                {isManaged ? "Managed" : "Unclaimed"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${
                  business.verified
                    ? "bg-green-100 text-green-800"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {business.verified ? "verified" : "shield"}
                </span>
                {business.verified ? "Verified" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href={`/business/${business.id}`}
            target="_blank"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-outline-variant bg-white px-4 text-xs font-bold text-on-surface hover:border-primary/40 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            Public profile
          </Link>
        </div>
      </div>

      {/* Verification Management Card */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">Verification badge</h2>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              The verified badge displays next to the business name to signal customer trust.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConfirmingVerification(true)}
            className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-colors ${
              business.verified
                ? "border border-red-200 text-red-600 hover:bg-red-50"
                : "bg-primary text-white hover:bg-[#0f46b8]"
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">
              {business.verified ? "remove_moderator" : "verified"}
            </span>
            {business.verified ? "Revoke verification" : "Grant verified badge"}
          </button>
        </div>
      </section>

      {/* Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Listing Information */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">Listing details</h2>
          <div className="mt-4 space-y-3 divide-y divide-outline-variant/60 text-xs">
            <div className="flex justify-between pt-2">
              <span className="text-on-surface-variant">Phone</span>
              <span className="font-semibold text-on-surface">{business.phone || "Not set"}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Price Range</span>
              <span className="font-semibold text-on-surface">{business.priceRange}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Opening Hours</span>
              <span className="font-semibold text-on-surface">{business.openingHours}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Reservations</span>
              <span className="font-semibold text-on-surface">
                {business.reservationAvailable ? "Available" : "Not enabled"}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Features / Tags</span>
              <span className="max-w-[60%] text-right font-semibold text-on-surface">
                {business.tags.join(", ") || "None"}
              </span>
            </div>
          </div>
        </section>

        {/* Operational Overview */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">Menu & updates</h2>
          <div className="mt-4 space-y-4 text-xs">
            {/* Menu summary */}
            <div className="rounded-xl border border-outline-variant/70 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface">Menu</span>
                <span className="text-on-surface-variant">
                  {menuSummary.categoryCount} categories · {menuSummary.itemCount} items
                </span>
              </div>
              <p className="mt-1 text-on-surface-variant">
                {menuSummary.hasMenu
                  ? "Menu has been configured for this business."
                  : "No menu items configured yet."}
              </p>
            </div>

            {/* Updates summary */}
            <div className="rounded-xl border border-outline-variant/70 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface">Business Updates</span>
                <span className="text-on-surface-variant">{updates.length} updates</span>
              </div>
              <p className="mt-1 text-on-surface-variant">
                {updates.length > 0
                  ? `${updates.filter((u) => u.status === "published").length} currently active.`
                  : "No promotional updates published."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal */}
      {isConfirmingVerification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">
              {business.verified
                ? `Revoke verified badge for ${business.name}?`
                : `Grant verified badge to ${business.name}?`}
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {business.verified
                ? "This will remove the verification badge from the business profile and search cards."
                : "This badge communicates to diners that Cafnet has verified this place as a legitimate, authentic business."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmingVerification(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleVerification}
                className={`h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors ${
                  business.verified
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-[#0f46b8]"
                }`}
              >
                {business.verified ? "Revoke badge" : "Grant badge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
