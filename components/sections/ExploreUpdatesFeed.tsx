"use client";

import { useEffect, useState } from "react";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import * as updatesApi from "@/lib/api/updates";
import { apiUpdateToViewModel, type BusinessUpdateViewModel } from "@/lib/api/adapters";

export default function ExploreUpdatesFeed() {
  const [updates, setUpdates] = useState<BusinessUpdateViewModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadUpdates = async () => {
      try {
        const apiData = await updatesApi.listActiveUpdates({ limit: 6 });
        if (!cancelled && apiData) {
          setUpdates(apiData.map(apiUpdateToViewModel));
          return;
        }
      } catch {
        // Fall back gracefully to empty state
      }
      if (!cancelled) {
        setUpdates([]);
      }
      if (!cancelled) {
        setLoading(false);
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
      {updates.map((update) => (
        <BusinessUpdateCard
          key={update.id}
          update={update}
          showBusinessName
          showTimestamp
        />
      ))}
    </div>
  );
}
