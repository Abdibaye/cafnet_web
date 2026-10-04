"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";

type BusinessProfileActionsProps = {
  businessId: number;
  businessName: string;
  address: string;
  phone?: string;
  hasUpdates: boolean;
  reservationAvailable: boolean;
  createdByUserId?: string;
  isOwner?: boolean;
};

export default function BusinessProfileActions({
  businessId,
  businessName,
  address,
  phone,
  hasUpdates,
  reservationAvailable,
  createdByUserId,
  isOwner: propIsOwner,
}: BusinessProfileActionsProps) {
  const { isAuthenticated, currentUser, isSaved, isFollowing, requestAction, showToast } = useCustomer();
  const { isBusinessManaged, rawManagedBusinesses, managedBusinesses } = useBusinessOwner();

  const isOwner = Boolean(
    isAuthenticated && (
      Boolean(propIsOwner) ||
      isBusinessManaged?.(businessId) ||
      (createdByUserId && currentUser?.id && String(createdByUserId) === String(currentUser.id)) ||
      rawManagedBusinesses.some((b) => b.id === businessId) ||
      managedBusinesses.some((mb) => mb.businessId === businessId)
    )
  );

  const saved = isSaved(businessId);
  const following = isFollowing(businessId);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, text: `Discover ${businessName} on Cafnet`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  };

  const actionButton = (label: string, icon: string, onClick: () => void, primary = false) => (
    <button
      type="button"
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        primary
          ? "bg-primary text-white hover:bg-[#0f46b8]"
          : "border border-outline-variant bg-white text-on-surface hover:border-primary/40 hover:text-primary"
      }`}
      onClick={onClick}
    >
      <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {isOwner && (
          <Link
            href={`/business/dashboard/business/${businessId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
              storefront
            </span>
            Manage Business
          </Link>
        )}
        {reservationAvailable && (
          <a
            href={`/reserve/${businessId}`}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
              event_available
            </span>
            Reserve a table
          </a>
        )}
        {actionButton(
          "Get directions",
          "directions",
          () =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
              "_blank",
              "noopener,noreferrer"
            ),
          true
        )}
        {phone && actionButton("Call", "call", () => window.open(`tel:${phone.replaceAll(" ", "")}`, "_self"))}
        {actionButton(saved ? "Saved" : "Save", saved ? "bookmark" : "bookmark_border", () =>
          requestAction("save", businessId)
        )}
        {actionButton("Share", "share", () => {
          void share();
        })}
      </div>
      {hasUpdates && (
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
          onClick={() => requestAction("follow", businessId)}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            notifications_none
          </span>
          {following ? "Following" : "Follow updates"}
        </button>
      )}
      <span className="sr-only">Profile actions for business {businessId}</span>
    </>
  );
}