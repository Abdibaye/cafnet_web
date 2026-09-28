import Link from "next/link";

export default function BusinessNotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
      <span className="material-symbols-outlined text-5xl text-outline mb-4" aria-hidden="true">
        storefront
      </span>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Place not found
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface sm:text-4xl">
        Business not found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
        We couldn&apos;t find this place. It may have been removed or the link might be incorrect.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/explore"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8] transition-colors"
        >
          Explore businesses
        </Link>
        <Link
          href="/search"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-outline-variant px-6 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
        >
          Search places
        </Link>
      </div>
    </div>
  );
}
