"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listBusinesses } from "@/lib/api/businesses";
import { deleteBusiness } from "@/lib/api/admin";
import { useCustomer } from "@/components/CustomerProvider";
import type { Business } from "@/lib/api/types";

export default function AdminBusinessesPage() {
  const { showToast } = useCustomer();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string | number; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listBusinesses({ limit: 100 });
      setBusinesses(res.businesses || []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = businesses.filter((b) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = b.name.toLowerCase().includes(q);
      const matchLocation = (b.location_name || "").toLowerCase().includes(q) || (b.neighborhood || "").toLowerCase().includes(q);
      const matchCuisine = b.cuisine.toLowerCase().includes(q);
      if (!matchName && !matchLocation && !matchCuisine) return false;
    }

    // Category
    if (categoryFilter !== "all" && b.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    // Claim
    const isClaimed = b.claim_status === "CLAIMED";
    if (claimFilter === "claimed" && !isClaimed) return false;
    if (claimFilter === "unclaimed" && isClaimed) return false;

    // Creation Source
    if (sourceFilter === "admin_created" && b.creation_source !== "ADMIN_CREATED") return false;
    if (sourceFilter === "owner_submission" && b.creation_source === "ADMIN_CREATED") return false;

    // Verified
    const isVerified = b.verification_status === "VERIFIED";
    if (verifiedFilter === "verified" && !isVerified) return false;
    if (verifiedFilter === "unverified" && isVerified) return false;

    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Platform Governance
          </p>
          <h1 className="mt-1 text-3xl font-bold text-on-surface">Businesses</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Inspect listings, review verification statuses, and monitor management rights.
          </p>
        </div>

        <Link
          href="/admin/businesses/add"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Business
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search by business name, cuisine, or neighborhood..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 w-full rounded-xl border border-outline-variant bg-transparent pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
          >
            <option value="all">All Sources</option>
            <option value="admin_created">Admin Created</option>
            <option value="owner_submission">Owner Submission</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="restaurant">Restaurants</option>
            <option value="cafe">Cafés</option>
            <option value="drinks">Drinks & More</option>
          </select>

          <select
            value={claimFilter}
            onChange={(e) => setClaimFilter(e.target.value)}
            className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
          >
            <option value="all">All Claim Statuses</option>
            <option value="claimed">Managed / Claimed</option>
            <option value="unclaimed">Unclaimed</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="h-11 rounded-xl border border-outline-variant bg-white px-3 text-xs font-semibold text-on-surface outline-none focus:border-primary"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant">
        <span>
          Showing {filtered.length} of {businesses.length} businesses
        </span>
      </div>

      {/* Business Cards List */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-5"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">storefront</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No businesses found</h2>
          <p className="mt-1 text-xs">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((business) => {
            const isManaged = business.claim_status === "CLAIMED";
            const isVerified = business.verification_status === "VERIFIED";

            return (
              <div
                key={business.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80"
              >
                <div>
                  {/* Top info & tags */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate text-base font-bold text-on-surface">
                          {business.name}
                        </h2>
                      </div>
                      <p className="mt-0.5 text-xs text-on-surface-variant">
                        {business.category} · {business.location_name || business.neighborhood}
                      </p>
                    </div>
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary">
                      <span className="material-symbols-outlined text-2xl">storefront</span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {/* Source badge */}
                    {business.creation_source === "ADMIN_CREATED" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-800">
                        <span className="material-symbols-outlined text-[13px]">admin_panel_settings</span>
                        Admin Created
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        <span className="material-symbols-outlined text-[13px]">person</span>
                        Owner Submitted
                      </span>
                    )}

                    {/* Claim badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isManaged
                          ? "bg-primary-container/50 text-primary"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isManaged ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {isManaged ? "Managed" : "Unclaimed"}
                    </span>

                    {/* Verified badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isVerified ? "verified" : "shield"}
                      </span>
                      {isVerified ? "Verified" : "Unverified"}
                    </span>

                    {business.price_range && (
                      <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {business.price_range}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-6 flex items-center justify-between border-t border-outline-variant/60 pt-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-container px-3 text-xs font-bold text-on-surface transition-colors hover:bg-primary hover:text-white"
                    >
                      Inspect
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setBusinessToDelete({ id: business.id, name: business.name })}
                      title="Delete business completely"
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                  </div>

                  <Link
                    href={`/business/${business.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#0f46b8]"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    Public profile
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {businessToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-delete-modal-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-outline-variant">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h2 id="admin-delete-modal-title" className="text-lg font-bold text-on-surface">
              Delete business completely?
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-on-surface">{businessToDelete.name}</strong> from the platform? This will completely remove the business, its menu, active updates, gallery photos, reviews, and reservations.
            </p>
            <p className="mt-2 text-xs font-semibold text-red-600">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setBusinessToDelete(null)}
                className="h-10 rounded-xl px-4 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  try {
                    setIsDeleting(true);
                    await deleteBusiness(businessToDelete.id);
                    showToast(`"${businessToDelete.name}" deleted from platform`);
                    setBusinessToDelete(null);
                    await loadData();
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Failed to delete business";
                    showToast(msg);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
