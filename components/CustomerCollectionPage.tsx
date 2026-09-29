"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import { useCustomer } from "@/components/CustomerProvider";
import { getAllBusinesses, toBusinessCardItem, getBusinessById } from "@/data/mockBusinesses";
import { getActiveUpdates } from "@/data/businessUpdateStorage";

type CustomerCollectionPageProps = { kind: "saved" | "following" };

export default function CustomerCollectionPage({ kind }: CustomerCollectionPageProps) {
  const { authReady, isAuthenticated, currentUser, startSignIn } = useCustomer();
  const ids = kind === "saved" ? currentUser?.savedBusinessIds || [] : currentUser?.followedBusinessIds || [];
  const businesses = getAllBusinesses().filter((business) => ids.includes(business.id));
  const title = kind === "saved" ? "Saved places" : "Following";
  const emptyText = kind === "saved" ? "Save places you want to remember and they'll appear here." : "Follow a business to keep up with its updates.";

  const loadUpdates = useCallback(
    () => (kind === "following" ? getActiveUpdates().filter((u) => ids.includes(u.businessId)) : []),
    [kind, ids],
  );

  const [followedUpdates, setFollowedUpdates] = useState(loadUpdates);

  useEffect(() => {
    setFollowedUpdates(loadUpdates());
    const handler = () => setFollowedUpdates(loadUpdates());
    window.addEventListener("cafnet:updates-updated", handler);
    return () => window.removeEventListener("cafnet:updates-updated", handler);
  }, [loadUpdates]);

  if (!authReady) return <div className="mx-auto max-w-7xl px-5 py-20 text-sm text-on-surface-variant">Loading...</div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Sign in to see {title.toLowerCase()}</h1><p className="mt-3 text-sm text-on-surface-variant">{kind === "saved" ? "Save places you love and find them again." : "Follow businesses you care about."}</p><button type="button" className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={startSignIn}>Continue with phone</button></div>;

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-12 lg:py-16">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Your Cafnet</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">{title}</h1>
        </div>
        <p className="text-sm text-on-surface-variant">{businesses.length} {businesses.length === 1 ? "place" : "places"}</p>
      </div>
      
      {kind === "following" && followedUpdates.length > 0 && (
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface">Recent updates from places you follow</h2>
            <p className="mt-2 text-sm text-on-surface-variant">New menus, offers, and events from your favorite places.</p>
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
      
      {businesses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {businesses.map((business) => (
            <BusinessCard key={business.id} item={toBusinessCardItem(business)} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-bold text-on-surface">
            {kind === "saved" ? "Nothing saved yet" : "You're not following any businesses yet."}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">{emptyText}</p>
          <Link href="/explore" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]">
            Explore places
          </Link>
        </div>
      )}
    </div>
  );
}