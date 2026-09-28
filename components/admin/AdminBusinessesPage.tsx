"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllBusinesses, type MockBusiness } from "@/data/mockBusinesses";
import { getManagedBusiness } from "@/data/ownerManagedBusinessStorage";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<MockBusiness[]>(() => getAllBusinesses());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [claimFilter, setClaimFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");

  const reload = () => {
    setBusinesses(getAllBusinesses());
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
  }, []);

  const filtered = businesses.filter((b) => {
    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = b.name.toLowerCase().includes(q);
      const matchLocation = b.location.toLowerCase().includes(q);
      const matchCuisine = b.cuisine.toLowerCase().includes(q);
      if (!matchName && !matchLocation && !matchCuisine) return false;
    }

    // Category
    if (categoryFilter !== "all" && b.category !== categoryFilter) return false;

    // Claim
    const isManaged = Boolean(getManagedBusiness(b.id) || b.claimStatus === "claimed");
    if (claimFilter === "claimed" && !isManaged) return false;
    if (claimFilter === "unclaimed" && isManaged) return false;

    // Verified
    if (verifiedFilter === "verified" && !b.verified) return false;
    if (verifiedFilter === "unverified" && b.verified) return false;

    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Businesses</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Inspect listings, review verification statuses, and monitor management rights.
        </p>
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
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">storefront</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No businesses found</h2>
          <p className="mt-1 text-xs">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((business) => {
            const isManaged = Boolean(
              getManagedBusiness(business.id) || business.claimStatus === "claimed"
            );
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
                        {business.category} · {business.location}
                      </p>
                    </div>
                    {business.images && business.images.length > 0 && (
                      <img
                        src={business.images[0]}
                        alt=""
                        className="size-12 shrink-0 rounded-xl object-cover"
                      />
                    )}
                  </div>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
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
                        business.verified
                          ? "bg-green-100 text-green-800"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {business.verified ? "verified" : "shield"}
                      </span>
                      {business.verified ? "Verified" : "Unverified"}
                    </span>

                    {business.priceRange && (
                      <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                        {business.priceRange}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="mt-6 flex items-center justify-between border-t border-outline-variant/60 pt-4">
                  <Link
                    href={`/admin/businesses/${business.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface-container px-3 text-xs font-bold text-on-surface transition-colors hover:bg-primary hover:text-white"
                  >
                    Inspect
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>

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
    </div>
  );
}
