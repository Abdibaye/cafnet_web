import Link from "next/link";
import {
  formatUpdateDate,
  getUpdateTypeLabel,
  getUpdateTypeIcon,
  type BusinessUpdateViewModel,
} from "@/lib/api/adapters";

type BusinessUpdateCardProps = {
  update: BusinessUpdateViewModel;
  business?: any;
  showBusinessName?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
};

export default function BusinessUpdateCard({
  update,
  business,
  showBusinessName = false,
  showTimestamp = true,
  compact = false,
}: BusinessUpdateCardProps) {
  const typeLabel = getUpdateTypeLabel(update.type);
  const typeIcon = getUpdateTypeIcon(update.type);

  return (
    <article
      className={`border border-outline-variant bg-white p-5 transition-shadow hover:shadow-md ${
        compact ? "" : "rounded-[14px]"
      }`}
    >
      <div className="flex items-start gap-4">
        {business?.images?.[0] && !compact && (
          <img
            src={business.images[0]}
            alt=""
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">
              {typeIcon}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {typeLabel}
            </span>
          </div>
          
          {showBusinessName && (
            <h3 className="mt-2 font-bold text-on-surface">
              {business?.name ? (
                <Link href={`/business/${update.businessId}`} className="hover:text-primary transition-colors">
                  {business.name}
                </Link>
              ) : (
                <Link href={`/business/${update.businessId}`} className="hover:text-primary transition-colors">
                  {`Business #${update.businessId}`}
                </Link>
              )}
            </h3>
          )}
          
          <h4 className={`mt-2 font-semibold text-on-surface ${showBusinessName ? "" : "text-lg"}`}>
            {update.title}
          </h4>
          
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {update.description}
          </p>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-on-surface-variant">
              {showTimestamp && (
                <span>Published {formatUpdateDate(update.publishedAt)}</span>
              )}
              {update.eventDate && (
                <span>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">event</span>
                  {update.eventDate}
                </span>
              )}
              {update.validUntil && (
                <span>
                  <span className="material-symbols-outlined text-[14px]" aria-hidden="true">schedule</span>
                  Until {new Date(update.validUntil).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {!compact && (
              <Link
                href={`/business/${update.businessId}`}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                View place
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
