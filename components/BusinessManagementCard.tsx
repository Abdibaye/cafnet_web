"use client";

import { useState } from "react";
import Link from "next/link";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { BusinessClaim, BusinessSubmission } from "@/data/businessOwnerStorage";
import type { BusinessProfileViewModel } from "@/lib/api/adapters";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { useCustomer } from "@/components/CustomerProvider";

type BusinessManagementCardProps = {
  business?: MockBusiness | BusinessProfileViewModel;
  claim?: BusinessClaim;
  submission?: BusinessSubmission;
  isManaged?: boolean;
  onDelete?: (businessId: string | number, businessName: string) => void;
};

export default function BusinessManagementCard({
  business,
  claim,
  submission,
  isManaged: propIsManaged,
  onDelete,
}: BusinessManagementCardProps) {
  const [imgError, setImgError] = useState(false);
  const { isBusinessManaged } = useBusinessOwner();
  const { currentUser } = useCustomer();
  const isAdmin = currentUser?.role === "ADMIN";
  const contextManaged = business ? isBusinessManaged?.(business.id) : false;
  const isManaged = propIsManaged ?? Boolean(contextManaged || business?.claimStatus === "claimed");
  const title = business?.name || submission?.businessName || "Business";

  const detailHref =
    isManaged && business
      ? `/business/dashboard/business/${business.id}`
      : claim
      ? `/business/dashboard/claim/${claim.id}`
      : submission
      ? `/business/dashboard/submission/${submission.id}`
      : "/business/dashboard";

  const coverUrl =
    (business && "cover_image" in business && typeof (business as any).cover_image === "string" && (business as any).cover_image) ||
    (business?.images && business.images.length > 0 && business.images[0] !== "/images/cafnet-placeholder.svg" ? business.images[0] : null) ||
    submission?.cover_image_url ||
    null;

  return (
    <Link
      href={detailHref}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99] sm:gap-4 sm:p-5"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        {/* Cover image container - landscape ratio fitted for cover images */}
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-outline-variant/50 bg-surface-container-low sm:h-16 sm:w-24">
          {coverUrl && !imgError ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-outline/60">
              <span className="material-symbols-outlined text-2xl sm:text-3xl" aria-hidden="true">
                storefront
              </span>
            </div>
          )}
        </div>

        {/* Business Title */}
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-on-surface transition-colors group-hover:text-primary sm:text-lg">
            {title}
          </h2>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-2">
        {isAdmin && business?.id && onDelete && (
          <button
            type="button"
            title="Delete business completely"
            aria-label={`Delete ${title} completely`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(business.id, title);
            }}
            className="flex size-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              delete
            </span>
          </button>
        )}

        {/* Mobile chevron to indicate full card clickability */}
        <div className="flex shrink-0 items-center text-outline-variant transition-colors group-hover:text-primary sm:hidden">
          <span className="material-symbols-outlined text-xl" aria-hidden="true">
            chevron_right
          </span>
        </div>

        {/* Desktop "Manage business" button */}
        <div className="hidden shrink-0 sm:block">
          <span className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-colors group-hover:bg-[#0f46b8] active:scale-[0.98]">
            Manage business
          </span>
        </div>
      </div>
    </Link>
  );
}
