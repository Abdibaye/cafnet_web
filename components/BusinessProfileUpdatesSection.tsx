"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { MergedBusinessProfile } from "@/data/businessProfileData";
import * as updatesApi from "@/lib/api/updates";
import { apiUpdateToViewModel, type BusinessUpdateViewModel } from "@/lib/api/adapters";

type BusinessProfileUpdatesSectionProps = {
  business: MockBusiness | MergedBusinessProfile;
};

export default function BusinessProfileUpdatesSection({ business }: BusinessProfileUpdatesSectionProps) {
  const [updates, setUpdates] = useState<BusinessUpdateViewModel[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadUpdates = async () => {
      try {
        const apiUpdates = await updatesApi.listBusinessUpdates(business.id);
        if (!cancelled && apiUpdates) {
          setUpdates(apiUpdates.map(apiUpdateToViewModel));
          return;
        }
      } catch {
        // Fall back gracefully
      }
      if (!cancelled) {
        setUpdates([]);
      }
    };

    loadUpdates();
    window.addEventListener("cafnet:updates-updated", loadUpdates);
    return () => {
      cancelled = true;
      window.removeEventListener("cafnet:updates-updated", loadUpdates);
    };
  }, [business.id]);

  if (updates.length === 0) {
    return (
      <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">
        No updates yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {updates.slice(0, 3).map((update) => (
        <BusinessUpdateCard
          key={update.id}
          update={update}
          business={business as MockBusiness}
          showTimestamp
          compact
        />
      ))}
      {updates.length > 3 && (
        <div className="pt-2">
          <p className="text-xs text-on-surface-variant">
            Showing 3 of {updates.length} active updates.
          </p>
        </div>
      )}
    </div>
  );
}
