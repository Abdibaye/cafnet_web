"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BusinessUpdateCard from "@/components/BusinessUpdateCard";
import { getUpdatesByBusiness, isUpdateExpired, type BusinessUpdate } from "@/data/businessUpdateStorage";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { MergedBusinessProfile } from "@/data/businessProfileData";

type BusinessProfileUpdatesSectionProps = {
  business: MockBusiness | MergedBusinessProfile;
};

export default function BusinessProfileUpdatesSection({ business }: BusinessProfileUpdatesSectionProps) {
  const [updates, setUpdates] = useState<BusinessUpdate[]>(() => {
    return getUpdatesByBusiness(business.id).filter((u) => u.status === "published" && !isUpdateExpired(u));
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = getUpdatesByBusiness(business.id).filter((u) => u.status === "published" && !isUpdateExpired(u));
      setUpdates(current);
    };

    handleUpdate();
    window.addEventListener("cafnet:updates-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:updates-updated", handleUpdate);
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
