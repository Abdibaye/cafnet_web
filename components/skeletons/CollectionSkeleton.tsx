import BusinessCardSkeleton from "./BusinessCardSkeleton";

type CollectionSkeletonProps = {
  title?: string;
  count?: number;
  layout?: "grid" | "list";
};

export default function CollectionSkeleton({ title = "Loading...", count = 6, layout = "grid" }: CollectionSkeletonProps) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-12 lg:py-16 animate-pulse" aria-busy="true">
      <div className="mb-8 space-y-2">
        <div className="h-3.5 w-24 rounded bg-surface-container text-xs" />
        <div className="h-8 w-48 rounded-lg bg-surface-container-high" />
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <BusinessCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-outline-variant bg-white p-5 space-y-2">
              <div className="h-5 w-1/3 rounded bg-surface-container-high" />
              <div className="h-4 w-2/3 rounded bg-surface-container" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
