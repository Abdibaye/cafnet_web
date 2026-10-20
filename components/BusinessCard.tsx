"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { deleteBusiness } from "@/lib/api/businesses";

export interface BusinessCardItem {
  id: number;
  name: string;
  image: string;
  location: string;
  description: string;
  rating: number;
  reviews: number;
  tags: string[];
}

type BusinessCardProps = {
  item: BusinessCardItem;
  onDelete?: (id: number) => void;
};

const technicalSignals = new Set([
  "credit card accepted",
  "card & telebirr",
  "wi-fi available",
  "parking available",
  "non-smoking",
]);

function getDiscoverySignal(tags: string[]) {
  if (!tags || tags.length === 0) return "";
  return tags.find((tag) => !technicalSignals.has(tag.toLowerCase())) || "";
}

export default function BusinessCard({ item, onDelete }: BusinessCardProps) {
  const { isSaved, requestAction, currentUser, showToast } = useCustomer();
  const isAdmin = currentUser?.role === "ADMIN";
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const saved = isSaved(item.id);
  const [place, distance] = (item.location || "").split(/,\s*(?=\d)/, 2);
  const discoverySignal = getDiscoverySignal(item.tags);

  if (isDeleted) {
    return null;
  }

  return (
    <article className="group flex min-h-97 flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-white transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-[0_8px_24px_rgba(20,33,61,0.07)]">
      <div className="relative h-52 w-full shrink-0 overflow-hidden bg-surface-container-low">
        <Link href={`/business/${item.id}`} aria-label={`View ${item.name}`} className="block h-full">
          <img
            alt={`${item.name} dining`}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            src={item.image || "/images/cafnet-placeholder.svg"}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
            }}
          />
        </Link>
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsConfirmingDelete(true);
            }}
            className="absolute left-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/95 text-red-600 shadow-sm transition-all duration-200 hover:bg-red-600 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-95"
            aria-label={`Delete ${item.name} completely`}
            title="Delete business completely (Admin)"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => requestAction("save", item.id)}
          className={`absolute right-4 top-4 flex size-11 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors duration-200 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            saved ? "text-secondary" : "text-on-surface"
          }`}
          aria-label={saved ? `Remove ${item.name} from saved places` : `Save ${item.name}`}
          aria-pressed={saved}
        >
          <span className="material-symbols-outlined text-[21px]" data-filled={saved ? "true" : undefined}>
            {saved ? "bookmark" : "bookmark_border"}
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <Link href={`/business/${item.id}`} className="min-w-0">
          <h3 className="truncate text-[18px] font-semibold leading-6 text-on-surface transition-colors duration-200 group-hover:text-primary">
            {item.name}
          </h3>
        </Link>

        {place ? (
          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] leading-5">
            <span className="material-symbols-outlined shrink-0 text-[17px] text-secondary">location_on</span>
            <span className="truncate text-on-surface-variant">{place}</span>
            {distance && <span className="shrink-0 text-on-surface-variant/70">· {distance}</span>}
          </div>
        ) : null}

        {item.description ? (
          <p className="mt-3 line-clamp-2 text-[13px] leading-5 text-on-surface-variant">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5 text-[12px] leading-4">
          <div className="flex min-w-0 items-center gap-2">
            {item.reviews > 0 ? (
              <>
                <span className="shrink-0 font-semibold text-secondary">
                  {item.rating.toFixed(1)} <span aria-hidden="true">★</span>
                </span>
                <span className="truncate text-on-surface-variant">· {item.reviews.toLocaleString()} reviews</span>
              </>
            ) : (
              <span className="font-semibold text-primary">New on Cafnet</span>
            )}
          </div>
          {discoverySignal ? (
            <span className="max-w-[42%] shrink-0 text-right font-semibold text-primary">{discoverySignal}</span>
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-card-modal-${item.id}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-outline-variant"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-4">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>
            <h2 id={`delete-card-modal-${item.id}`} className="text-lg font-bold text-on-surface">
              Delete business completely?
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-on-surface">{item.name}</strong> from the platform? This will completely remove the business, its menu, active updates, gallery photos, reviews, and reservations.
            </p>
            <p className="mt-2 text-xs font-semibold text-red-600">
              This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsConfirmingDelete(false);
                }}
                className="h-10 rounded-xl px-4 text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  try {
                    setIsDeleting(true);
                    await deleteBusiness(item.id);
                    showToast(`"${item.name}" deleted from platform`);
                    setIsDeleted(true);
                    setIsConfirmingDelete(false);
                    onDelete?.(item.id);
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Failed to delete business";
                    showToast(msg);
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
    </article>
  );
}
