import BusinessCardSkeleton from "@/components/skeletons/BusinessCardSkeleton";

export default function SearchLoading() {
  return (
    <div className="w-full bg-background">
      <div className="border-b border-outline-variant/60 bg-white py-4">
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
          <div className="h-12 w-full max-w-2xl rounded-xl bg-surface-container animate-pulse" />
        </div>
      </div>
      <section className="brand-section bg-background pt-4 md:pt-6">
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3 animate-pulse">
            <div>
              <div className="h-3.5 w-16 rounded bg-surface-container" />
              <div className="mt-2 h-7 w-48 rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <BusinessCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
