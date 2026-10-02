"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";

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
};

const technicalSignals = new Set([
  "credit card accepted",
  "card & telebirr",
  "wi-fi available",
  "parking available",
  "non-smoking",
]);

function getDiscoverySignal(tags: string[]) {
  return tags.find((tag) => !technicalSignals.has(tag.toLowerCase())) || "Worth exploring";
}

export default function BusinessCard({ item }: BusinessCardProps) {
  const { isSaved, requestAction } = useCustomer();
  const saved = isSaved(item.id);
  const [place, distance] = item.location.split(/,\s*(?=\d)/, 2);
  const discoverySignal = getDiscoverySignal(item.tags);

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

        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-[13px] leading-5">
          <span className="material-symbols-outlined shrink-0 text-[17px] text-secondary">location_on</span>
          <span className="truncate text-on-surface-variant">{place}</span>
          {distance && <span className="shrink-0 text-on-surface-variant/70">· {distance}</span>}
        </div>

        <p className="mt-3 line-clamp-2 min-h-10 text-[13px] leading-5 text-on-surface-variant">
          {item.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5 text-[12px] leading-4">
          <div className="flex min-w-0 items-center gap-2">
            {item.reviews > 0 ? <><span className="shrink-0 font-semibold text-secondary">
              {item.rating.toFixed(1)} <span aria-hidden="true">★</span>
            </span>
            <span className="truncate text-on-surface-variant">· {item.reviews.toLocaleString()} reviews</span></> : <span className="font-semibold text-primary">New on Cafnet</span>}
          </div>
          <span className="max-w-[42%] shrink-0 text-right font-semibold text-primary">{discoverySignal}</span>
        </div>
      </div>
    </article>
  );
}
