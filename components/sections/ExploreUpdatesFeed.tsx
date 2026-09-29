"use client";

import { useEffect, useState } from "react";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import { getActiveUpdates, type BusinessUpdate } from "@/data/businessUpdateStorage";
import { getBusinessById } from "@/data/mockBusinesses";
import * as updatesApi from "@/lib/api/updates";
import { apiUpdateToStorageUpdate } from "@/lib/api/adapters";

export default function ExploreUpdatesFeed() {
  const [updates, setUpdates] = useState<BusinessUpdate[]>(() => getActiveUpdates().slice(0, 6));

  useEffect(() => {
    let cancelled = false;

    const loadUpdates = async () => {
      try {
        const apiData = await updatesApi.listActiveUpdates({ limit: 6 });
        if (!cancelled && apiData && apiData.length > 0) {
          setUpdates(apiData.map(apiUpdateToStorageUpdate));
          return;
        }
      } catch {
        // Fall back gracefully to local storage
      }
      if (!cancelled) {
        setUpdates(getActiveUpdates().slice(0, 6));
      }
    };

    loadUpdates();
    window.addEventListener("cafnet:updates-updated", loadUpdates);
    return () => {
      cancelled = true;
      window.removeEventListener("cafnet:updates-updated", loadUpdates);
    };
  }, []);

  if (updates.length === 0) {
    return (
      <div className="border border-dashed border-outline-variant bg-white px-6 py-10 text-center">
        <span className="material-symbols-outlined text-3xl text-outline mb-2" aria-hidden="true">
          campaign
        </span>
        <h3 className="text-base font-bold text-on-surface">No updates yet</h3>
        <p className="mt-1 text-sm text-on-surface-variant">
          Check back soon for new menus, special offers, and events from local spots.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {updates.map((update) => {
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
  );
}
