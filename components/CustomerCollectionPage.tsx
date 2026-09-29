"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import { useCustomer } from "@/components/CustomerProvider";
import { getAllBusinesses, toBusinessCardItem, getBusinessById } from "@/data/mockBusinesses";
import { getActiveUpdates, type BusinessUpdate as StorageBusinessUpdate } from "@/data/businessUpdateStorage";
import * as customerApi from "@/lib/api/customer";
import * as updatesApi from "@/lib/api/updates";
import { businessToCardItem, apiUpdateToStorageUpdate } from "@/lib/api/adapters";
import type { Business } from "@/lib/api/types";

type CustomerCollectionPageProps = { kind: "saved" | "following" };

export default function CustomerCollectionPage({ kind }: CustomerCollectionPageProps) {
  const { authReady, isAuthenticated, currentUser, startSignIn } = useCustomer();
  const ids = kind === "saved" ? currentUser?.savedBusinessIds || [] : currentUser?.followedBusinessIds || [];
  const title = kind === "saved" ? "Saved places" : "Following";
  const emptyText =
    kind === "saved"
      ? "Save places you want to remember and they'll appear here."
      : "Follow a business to keep up with its updates.";

  const [apiBusinesses, setApiBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setApiBusinesses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const fetcher = kind === "saved" ? customerApi.getSavedBusinesses : customerApi.getFollowedBusinesses;

    fetcher()
      .then((data) => {
        if (!cancelled) setApiBusinesses(data || []);
      })
      .catch(() => {
        if (!cancelled) setApiBusinesses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, kind, currentUser?.savedBusinessIds, currentUser?.followedBusinessIds]);

  // Prefer authoritative API businesses; fallback to mock seed only if offline
  const cardItems: BusinessCardItem[] = (() => {
    if (apiBusinesses.length > 0) {
      return apiBusinesses.map((b) => businessToCardItem(b));
    }
    // Only fall back to mock businesses if still initializing or offline
    if (ids.length > 0 && !loading) {
      const mockList = getAllBusinesses().filter((b) => ids.includes(b.id));
      if (mockList.length > 0) {
        return mockList.map(toBusinessCardItem);
      }
    }
    return [];
  })();

  const [followedUpdates, setFollowedUpdates] = useState<StorageBusinessUpdate[]>([]);

  useEffect(() => {
    if (kind !== "following" || !isAuthenticated) {
      setFollowedUpdates([]);
      return;
    }

    let cancelled = false;
    const fetchFollowedUpdates = async () => {
      try {
        const apiUpdates = await updatesApi.listFollowingUpdates();
        if (!cancelled && Array.isArray(apiUpdates)) {
          const adapted = apiUpdates.map(apiUpdateToStorageUpdate);
          setFollowedUpdates(adapted);
          return;
        }
      } catch {
        // Fall back to local mock updates only if network/server is unreachable
        if (!cancelled) {
          setFollowedUpdates(getActiveUpdates().filter((u) => ids.includes(u.businessId)));
        }
      }
    };

    fetchFollowedUpdates();
    const handler = () => fetchFollowedUpdates();
    window.addEventListener("cafnet:updates-updated", handler);
    return () => {
      cancelled = true;
      window.removeEventListener("cafnet:updates-updated", handler);
    };
  }, [kind, isAuthenticated, ids]);

  if (!authReady) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-on-surface-variant">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">
          Sign in to see {title.toLowerCase()}
        </h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          {kind === "saved"
            ? "Save places you love and find them again."
            : "Follow businesses you care about."}
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Continue with phone
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Your Cafnet
          </p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">{title}</h1>
        </div>
        <p className="text-sm text-on-surface-variant">
          {cardItems.length} {cardItems.length === 1 ? "place" : "places"}
        </p>
      </div>

      {kind === "following" && followedUpdates.length > 0 && (
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface">
              Recent updates from places you follow
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              New menus, offers, and events from your favorite places.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {followedUpdates.map((update) => {
              const business = getBusinessById(update.businessId);
              return business ? (
                <BusinessUpdateCard
                  key={update.id}
                  update={update}
                  business={business}
                  showBusinessName
                  showTimestamp
                />
              ) : null;
            })}
          </div>
        </section>
      )}

      {loading && cardItems.length === 0 ? (
        <div className="py-12 text-center text-sm text-on-surface-variant">
          Loading your {title.toLowerCase()}...
        </div>
      ) : cardItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {cardItems.map((item) => (
            <BusinessCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-on-surface">
            {kind === "saved"
              ? "Nothing saved yet"
              : "You're not following any businesses yet."}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
            {emptyText}
          </p>
          <Link
            href="/explore"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
          >
            Explore places
          </Link>
        </div>
      )}
    </div>
  );
}