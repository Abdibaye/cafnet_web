import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import SplitSearchBar from "@/components/sections/SplitSearchBar";
import { listBusinesses } from "@/lib/api/businesses";
import { businessToCardItem } from "@/lib/api/adapters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const cuisines = ["Ethiopian", "Italian", "Asian", "Indian", "Bakery", "Coffee"];

function BusinessSection({ heading, items }: { heading: string; items: BusinessCardItem[] }) {
  return (
    <section className="brand-section bg-background">
      <div className="mx-auto max-w-7xl px-5 lg:px-12">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-8 sm:flex-row sm:items-end">
          <h2 className="text-[23px] font-bold leading-tight text-on-surface md:text-[28px]">{heading}</h2>
          <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-[#0f46b8]" href="/restaurants">
            View all <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
            {items.map((item) => <BusinessCard key={item.id} item={item} />)}
          </div>
        ) : (
          <div className="border border-dashed border-outline-variant bg-white px-6 py-10 text-center">
            <h3 className="text-base font-bold text-on-surface">No businesses found yet</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Be the first to list a restaurant or cafe on Cafnet!
            </p>
            <Link
              href="/business/add"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
            >
              Add your business <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default async function Home() {
  let popularPlaces: BusinessCardItem[] = [];

  try {
    const res = await listBusinesses({ category: "restaurant", limit: 3 });
    if (res.businesses && res.businesses.length > 0) {
      popularPlaces = res.businesses.map((b) => businessToCardItem(b));
    } else {
      // Graceful fallback to any top venues if restaurant category is empty
      const anyRes = await listBusinesses({ limit: 3 });
      if (anyRes.businesses && anyRes.businesses.length > 0) {
        popularPlaces = anyRes.businesses.map((b) => businessToCardItem(b));
      }
    }
  } catch (err) {
    console.error("Failed to fetch popular businesses for homepage:", err);
    popularPlaces = [];
  }
  return (
    <div className="w-full bg-background">
      <section className="mx-auto max-w-7xl px-5 pb-0 pt-8 lg:px-12 lg:pt-14">
        <h1 className="max-w-3xl text-[30px] font-bold leading-tight tracking-tight text-on-surface md:text-[46px]">
          Find somewhere good to eat.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-6 text-on-surface-variant md:mt-3 md:text-base">
          Restaurants, cafés, and places worth discovering around you.
        </p>
      </section>

      <SplitSearchBar />

      {/* AI Food Assistant Discovery Banner */}
      <section className="mx-auto max-w-7xl px-5 pt-3 pb-3 lg:px-12">
        <Link
          href="/assistant"
          className="group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-r from-primary-container/60 via-white to-secondary-container/40 p-6 md:p-7 shadow-sm transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:-translate-y-0.5"
        >
          {/* Subtle decorative glow */}
          <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-2xl" />

          <div className="flex items-start md:items-center gap-4">
            <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary via-[#2563eb] to-[#f97316] text-white shadow-md shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
              <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
              <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase tracking-wider text-secondary">
                  AI Food Discovery
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Gemini RAG
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  New
                </span>
              </div>

              <h2 className="mt-1 text-base font-extrabold text-on-surface md:text-xl group-hover:text-primary transition-colors">
                Know what you want, but not where to find it?
              </h2>

              <p className="mt-1 text-xs text-on-surface-variant md:text-sm leading-relaxed">
                Ask our Food Assistant in English or Amharic for dishes, live ETB prices, and neighborhood spots.
              </p>

              {/* Sample prompt pills */}
              <div className="mt-2.5 hidden sm:flex items-center gap-2 flex-wrap">
                <span className="rounded-lg bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-on-surface border border-outline-variant/60">
                  💡 "Best kitfo in Bole under 350 ETB"
                </span>
                <span className="rounded-lg bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-on-surface border border-outline-variant/60">
                  🇪🇹 "ምርጥ ክትፎ ቦሌ"
                </span>
                <span className="rounded-lg bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-on-surface border border-outline-variant/60">
                  ☕ "Quiet cafés in Kazanchis"
                </span>
              </div>
            </div>
          </div>

          <div className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-tr from-primary to-[#2563eb] px-5 py-3 text-xs font-bold text-white shadow-md shadow-primary/20 group-hover:scale-105 group-hover:shadow-lg transition-all">
            <span>Ask Food Assistant</span>
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">
              arrow_forward
            </span>
          </div>
        </Link>
      </section>

      <BusinessSection heading="Popular restaurants near you" items={popularPlaces} />

      <section className="brand-section bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-on-surface md:text-[28px]">Explore by cuisine</h2>
            <p className="mt-2 text-sm text-on-surface-variant">Find somewhere good by starting with a flavor.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cuisines.map((cuisine) => (
              <Link key={cuisine} href="/cuisines" className="group flex items-center justify-between border border-outline-variant/70 bg-white px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary">
                {cuisine}
                <span className="material-symbols-outlined text-[18px] text-outline transition-colors group-hover:text-primary" aria-hidden="true">arrow_forward</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
