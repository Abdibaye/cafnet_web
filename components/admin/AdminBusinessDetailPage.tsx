"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBusinessProfile } from "@/lib/api/businesses";
import { setBusinessVerification, setBusinessPublication } from "@/lib/api/admin";
import type { PublicBusinessProfile } from "@/lib/api/types";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminBusinessDetailPage({ businessId }: { businessId: string }) {
  const numId = Number(businessId);
  const { showToast } = useCustomer();
  const [profile, setProfile] = useState<PublicBusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfirmingVerification, setIsConfirmingVerification] = useState(false);
  const [isConfirmingPublication, setIsConfirmingPublication] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (isNaN(numId)) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getBusinessProfile(numId);
      setProfile(data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [numId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-outline-variant/40" />
        <div className="h-44 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
        <div className="h-60 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
      </div>
    );
  }

  if (!profile || !profile.business) {
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

  const { business, menu, active_updates } = profile;
  const isManaged = business.claim_status === "CLAIMED";
  const isVerified = business.verification_status === "VERIFIED";
  const isPublished = business.publication_status === "PUBLISHED";

  const categoryCount = menu?.categories?.length || 0;
  const itemCount = (menu?.categories || []).reduce(
    (acc, cat) => acc + (cat.items?.length || 0),
    0
  );
  const updatesCount = active_updates?.length || 0;

  const handleToggleVerification = async () => {
    try {
      setIsSubmitting(true);
      const nextStatus = isVerified ? "UNVERIFIED" : "VERIFIED";
      await setBusinessVerification(business.id, nextStatus);
      showToast(nextStatus === "VERIFIED" ? "Verification badge granted" : "Verification badge revoked");
      setIsConfirmingVerification(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update verification status";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublication = async () => {
    try {
      setIsSubmitting(true);
      const nextStatus = isPublished ? "UNPUBLISHED" : "PUBLISHED";
      await setBusinessPublication(business.id, nextStatus);
      showToast(nextStatus === "PUBLISHED" ? "Business published live" : "Business unpublished");
      setIsConfirmingPublication(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update publication status";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
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
          {profile.images && profile.images.length > 0 ? (
            <img
              src={profile.images[0].image_url}
              alt={business.name}
              className="size-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-surface-container text-primary">
              <span className="material-symbols-outlined text-3xl">storefront</span>
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-on-surface">{business.name}</h1>
              <span className="text-xs font-semibold text-on-surface-variant">
                (ID: #{business.id})
              </span>
            </div>
            <p className="mt-1 text-sm text-on-surface-variant">
              {business.category} · {business.cuisine} · {business.location_name || business.neighborhood}
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
                  isVerified
                    ? "bg-green-100 text-green-800"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isVerified ? "verified" : "shield"}
                </span>
                {isVerified ? "Verified" : "Unverified"}
              </span>

              <span
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold ${
                  isPublished
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">
                  {isPublished ? "visibility" : "visibility_off"}
                </span>
                {isPublished ? "Published" : "Unpublished"}
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

      {/* Governance Controls: Verification & Publication */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Verification Control */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">Verification badge</h2>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              The verified badge displays next to the business name to signal authenticity and platform trust.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/60 flex justify-end">
            <button
              type="button"
              onClick={() => setIsConfirmingVerification(true)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-colors ${
                isVerified
                  ? "border border-red-200 text-red-600 hover:bg-red-50"
                  : "bg-primary text-white hover:bg-[#0f46b8]"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isVerified ? "remove_moderator" : "verified"}
              </span>
              {isVerified ? "Revoke verification" : "Grant verified badge"}
            </button>
          </div>
        </section>

        {/* Publication Control */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-on-surface">Listing publication</h2>
            <p className="mt-1 text-xs leading-5 text-on-surface-variant">
              Published businesses appear in customer searches, category listings, and explore pages.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-outline-variant/60 flex justify-end">
            <button
              type="button"
              onClick={() => setIsConfirmingPublication(true)}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-bold transition-colors ${
                isPublished
                  ? "border border-amber-300 text-amber-800 hover:bg-amber-50"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">
                {isPublished ? "visibility_off" : "publish"}
              </span>
              {isPublished ? "Unpublish listing" : "Publish listing"}
            </button>
          </div>
        </section>
      </div>

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
              <span className="font-semibold text-on-surface">{business.price_range || "Not set"}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">City / Location</span>
              <span className="font-semibold text-on-surface">{business.location_name || business.neighborhood}</span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Reservations</span>
              <span className="font-semibold text-on-surface">
                {business.reservation_available ? "Available" : "Not enabled"}
              </span>
            </div>
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Slug</span>
              <span className="font-mono text-on-surface">{business.slug}</span>
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
                  {categoryCount} categories · {itemCount} items
                </span>
              </div>
              <p className="mt-1 text-on-surface-variant">
                {itemCount > 0
                  ? "Menu has been configured for this business."
                  : "No menu items configured yet."}
              </p>
            </div>

            {/* Updates summary */}
            <div className="rounded-xl border border-outline-variant/70 p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface">Business Updates</span>
                <span className="text-on-surface-variant">{updatesCount} active updates</span>
              </div>
              <p className="mt-1 text-on-surface-variant">
                {updatesCount > 0
                  ? `${updatesCount} promotional updates currently live.`
                  : "No promotional updates published."}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Modal: Verification */}
      {isConfirmingVerification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">
              {isVerified
                ? `Revoke verified badge for ${business.name}?`
                : `Grant verified badge to ${business.name}?`}
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {isVerified
                ? "This will remove the verification badge from the business profile and search cards."
                : "This badge communicates to diners that Cafnet has verified this place as a legitimate, authentic business."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmingVerification(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleToggleVerification}
                className={`h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors ${
                  isVerified
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-primary hover:bg-[#0f46b8]"
                } disabled:opacity-50`}
              >
                {isSubmitting
                  ? "Updating..."
                  : isVerified
                  ? "Revoke badge"
                  : "Grant badge"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Publication */}
      {isConfirmingPublication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">
              {isPublished
                ? `Unpublish ${business.name}?`
                : `Publish ${business.name}?`}
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              {isPublished
                ? "This will hide the business listing from explore, search, and category indexes."
                : "This will make the business listing visible to all customers on Cafnet."}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsConfirmingPublication(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleTogglePublication}
                className={`h-10 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition-colors ${
                  isPublished
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {isSubmitting
                  ? "Updating..."
                  : isPublished
                  ? "Unpublish"
                  : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
