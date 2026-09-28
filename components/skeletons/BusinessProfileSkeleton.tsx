export default function BusinessProfileSkeleton() {
  return (
    <div className="w-full bg-background animate-pulse" aria-busy="true" aria-label="Loading business profile">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-12 lg:pt-12">
        {/* Header */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3 max-w-2xl w-full">
            <div className="h-8 md:h-10 w-3/4 rounded-lg bg-surface-container-high" />
            <div className="flex items-center gap-3">
              <div className="h-4 w-32 rounded bg-surface-container" />
              <div className="h-4 w-16 rounded bg-surface-container" />
              <div className="h-4 w-24 rounded bg-surface-container" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-40 rounded bg-surface-container" />
              <div className="h-4 w-20 rounded bg-surface-container" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="h-11 w-36 rounded-xl bg-surface-container-high" />
            <div className="h-11 w-32 rounded-xl bg-surface-container" />
            <div className="h-11 w-24 rounded-xl bg-surface-container" />
          </div>
        </header>

        {/* Gallery */}
        <div className="mb-8 h-[min(27rem,62vw)] w-full rounded-2xl bg-surface-container" />

        {/* Tabs */}
        <div className="mb-10 flex gap-6 border-b border-outline-variant pb-4">
          <div className="h-5 w-20 rounded bg-surface-container-high" />
          <div className="h-5 w-16 rounded bg-surface-container" />
          <div className="h-5 w-16 rounded bg-surface-container" />
          <div className="h-5 w-16 rounded bg-surface-container" />
        </div>

        {/* Content grid */}
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="h-6 w-32 rounded bg-surface-container-high" />
              <div className="h-4 w-full rounded bg-surface-container" />
              <div className="h-4 w-5/6 rounded bg-surface-container" />
              <div className="h-4 w-4/6 rounded bg-surface-container" />
            </section>

            <section className="space-y-4 pt-6 border-t border-outline-variant">
              <div className="h-6 w-40 rounded bg-surface-container-high" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-24 rounded-xl bg-surface-container-low" />
                <div className="h-24 rounded-xl bg-surface-container-low" />
              </div>
            </section>
          </div>

          <aside>
            <div className="rounded-[14px] border border-outline-variant bg-white p-5 space-y-4">
              <div className="h-6 w-32 rounded bg-surface-container-high" />
              <div className="h-4 w-full rounded bg-surface-container" />
              <div className="h-4 w-3/4 rounded bg-surface-container" />
              <div className="h-4 w-1/2 rounded bg-surface-container" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
