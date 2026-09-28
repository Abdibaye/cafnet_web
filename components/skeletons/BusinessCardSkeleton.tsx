export default function BusinessCardSkeleton() {
  return (
    <article className="flex min-h-97 flex-col overflow-hidden rounded-2xl border border-outline-variant/60 bg-white animate-pulse" aria-hidden="true">
      <div className="h-52 w-full bg-surface-container-low" />
      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <div className="h-6 w-3/4 rounded-md bg-surface-container-high" />
        <div className="mt-2 flex items-center gap-2">
          <div className="size-4 rounded-full bg-surface-container" />
          <div className="h-4 w-1/2 rounded bg-surface-container" />
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="h-3.5 w-full rounded bg-surface-container-low" />
          <div className="h-3.5 w-4/5 rounded bg-surface-container-low" />
        </div>
        <div className="mt-auto flex items-end justify-between pt-5">
          <div className="h-4 w-28 rounded bg-surface-container" />
          <div className="h-4 w-20 rounded bg-surface-container" />
        </div>
      </div>
    </article>
  );
}
