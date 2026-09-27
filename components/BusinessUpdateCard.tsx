import Link from "next/link";

export type BusinessUpdate = {
  businessId: number;
  businessName: string;
  businessImage: string;
  updateType: string;
  title: string;
  description?: string;
  createdAt: string;
  location: string;
  image?: string;
  href?: string;
  expiresAt?: string;
  offer?: string;
};

type BusinessUpdateCardProps = {
  update: BusinessUpdate;
  featured?: boolean;
};

export default function BusinessUpdateCard({ update, featured = false }: BusinessUpdateCardProps) {
  return (
    <article className={`group flex h-full flex-col justify-between border border-outline-variant/70 bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-primary/35 hover:shadow-[0_8px_24px_rgba(20,33,61,0.07)] ${featured ? "md:p-6" : ""}`}>
      <div>
        <div className="flex items-start justify-between gap-4">
          <Link href={update.href || `/business/${update.businessId}`} className="flex min-w-0 items-center gap-3">
            <img
              src={update.businessImage}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-on-surface transition-colors group-hover:text-primary">
                {update.businessName}
              </span>
              <span className="mt-0.5 block text-xs text-on-surface-variant">{update.createdAt}</span>
            </span>
          </Link>
          <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">
            {update.updateType}
          </span>
        </div>

        <Link href={update.href || `/business/${update.businessId}`} className="mt-6 block">
          <h3 className={`${featured ? "text-[22px] leading-8" : "text-lg leading-7"} font-semibold text-on-surface transition-colors group-hover:text-primary`}>
            {update.title}
          </h3>
          {update.description && (
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{update.description}</p>
          )}
        </Link>

        {update.image && (
          <img src={update.image} alt="" className="mt-5 h-32 w-full object-cover" />
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-outline-variant/70 pt-4 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 truncate text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px] text-outline" aria-hidden="true">location_on</span>
          {update.location}
        </span>
        <Link
          href={update.href || `/business/${update.businessId}`}
          className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary transition-colors hover:text-[#0f46b8]"
        >
          View place
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
        </Link>
      </div>
    </article>
  );
}
