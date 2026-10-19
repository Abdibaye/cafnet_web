import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import SearchBar from "@/components/sections/SearchBar";
import { popularSearches } from "@/data/popularSearches";
import { searchBusinesses as apiSearchBusinesses, searchFood } from "@/lib/api/search";
import { businessToCardItem } from "@/lib/api/adapters";
import type { FoodSearchResponse } from "@/lib/api/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; location?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const location = params.location?.trim() || "";
  const effectiveQuery = query || location;
  let results: BusinessCardItem[] = [];
  let foodResponse: FoodSearchResponse = { canonical_dish: null, items: [] };

  if (effectiveQuery) {
    // If query and location are both given, search combined; if empty query, search location
    const searchQuery = query && location ? `${query} ${location}` : effectiveQuery;
    const [bizSettled, foodSettled] = await Promise.allSettled([
      apiSearchBusinesses({ q: searchQuery }),
      searchFood({ q: query || location }),
    ]);

    if (bizSettled.status === "fulfilled" && bizSettled.value.results) {
      // If combined search had no matches, fallback to query alone
      if (bizSettled.value.results.length === 0 && query && location) {
        try {
          const fallbackRes = await apiSearchBusinesses({ q: query });
          if (fallbackRes.results) {
            results = fallbackRes.results.map((r) => businessToCardItem(r.business));
          }
        } catch {
          results = [];
        }
      } else {
        results = bizSettled.value.results.map((r) => businessToCardItem(r.business));
      }
    }
    if (foodSettled.status === "fulfilled" && foodSettled.value) {
      foodResponse = foodSettled.value;
    }
  }

  const hasFoodResults = foodResponse.items && foodResponse.items.length > 0;
  const hasPlaceResults = results.length > 0;
  const canonicalDish = foodResponse.canonical_dish;

  return (
    <div className="w-full bg-background">
      <SearchBar initialQuery={query} />
      <section className="brand-section bg-background pt-2 md:pt-6">
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
          {effectiveQuery ? (
            <>
              {/* Search Header */}
              <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                    Food & Place Discovery
                  </p>
                  <h1 className="mt-2 text-2xl font-bold text-on-surface md:text-[28px]">
                    {query && location
                      ? `Results for "${query}" near ${location}`
                      : query
                      ? `Results for "${query}"`
                      : `Places and restaurants in ${location}`}
                  </h1>
                  {canonicalDish && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        <span className="material-symbols-outlined text-[14px]">restaurant_menu</span>
                        Canonical dish: {canonicalDish.name}
                      </span>
                      {canonicalDish.aliases && canonicalDish.aliases.length > 0 && (
                        <span className="text-xs text-on-surface-variant">
                          Includes: {canonicalDish.aliases.slice(0, 3).map((a) => a.alias).join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-on-surface-variant">
                  {hasFoodResults && (
                    <span>
                      {foodResponse.items.length} {foodResponse.items.length === 1 ? "dish" : "dishes"}
                    </span>
                  )}
                  {hasFoodResults && hasPlaceResults && <span> · </span>}
                  {hasPlaceResults && (
                    <span>
                      {results.length} {results.length === 1 ? "place" : "places"}
                    </span>
                  )}
                </div>
              </div>

              {/* 1. Food Discovery Results (Where can I eat this?) */}
              {hasFoodResults && (
                <div className="mb-12">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-on-surface md:text-xl">
                        {canonicalDish
                          ? `Where to eat ${canonicalDish.name}`
                          : `Dishes matching "${query}"`}
                      </h2>
                      <p className="text-xs text-on-surface-variant">
                        Restaurant menu items classified under normalized discovery
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                    {foodResponse.items.map((item) => {
                      const biz = item.business;
                      const menuItem = item.menu_item;
                      const placeHref = `/places/${biz.slug || biz.id}`;
                      const priceFormatted = (menuItem.price_etb_minor / 100).toLocaleString();
                      const area = biz.neighborhood || biz.location_name || "Addis Ababa";
                      const rating = businessToCardItem(biz).rating;

                      return (
                        <div
                          key={`${biz.id}-${menuItem.id}`}
                          className="flex flex-col justify-between rounded-2xl border border-outline-variant/80 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                          <div>
                            {/* Restaurant info header */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link
                                  href={placeHref}
                                  className="text-sm font-bold text-on-surface hover:text-primary transition-colors"
                                >
                                  {biz.name}
                                </Link>
                                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                                  <span className="material-symbols-outlined text-[13px] text-secondary">
                                    location_on
                                  </span>
                                  <span>{area}</span>
                                  {biz.cuisine && (
                                    <>
                                      <span>•</span>
                                      <span>{biz.cuisine}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {rating > 0 && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200/60">
                                  ★ {rating.toFixed(1)}
                                </span>
                              )}
                            </div>

                            {/* Original Restaurant Menu Item Name */}
                            <div className="mt-4 border-t border-outline-variant/40 pt-3">
                              <div className="flex items-baseline justify-between gap-2">
                                <h3 className="text-base font-semibold text-on-surface">
                                  {menuItem.name}
                                </h3>
                                <span className="text-base font-bold text-primary whitespace-nowrap">
                                  {priceFormatted} ETB
                                </span>
                              </div>
                              {menuItem.description && (
                                <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                                  {menuItem.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer with canonical link */}
                          <div className="mt-4 flex items-center justify-between pt-3 border-t border-outline-variant/40">
                            {item.canonical_dish ? (
                              <span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-secondary">
                                Dish: {item.canonical_dish.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant">Menu match</span>
                            )}
                            <Link
                              href={placeHref}
                              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                            >
                              View menu <span className="text-[10px]">→</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Place / Business Results */}
              {hasPlaceResults && (
                <div>
                  {hasFoodResults && (
                    <div className="mb-4">
                      <h2 className="text-lg font-bold text-on-surface md:text-xl">
                        Places & Restaurants
                      </h2>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                    {results.map((item) => (
                      <BusinessCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Empty State */}
              {!hasFoodResults && !hasPlaceResults && (
                <div className="border border-dashed border-outline-variant bg-white px-6 py-12 text-center">
                  <h2 className="text-lg font-bold text-on-surface">
                    No dishes or places found for &quot;
                    {query && location ? `${query} near ${location}` : effectiveQuery}
                    &quot;
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
                    Try searching for dishes like Tibs, Kitfo, Shiro, Pizza, or a restaurant name.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {popularSearches.map((item) => (
                      <Link
                        key={item.query}
                        href={`/search?q=${encodeURIComponent(item.query)}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3.5 py-1.5 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[16px] text-secondary" aria-hidden="true">
                          search
                        </span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="max-w-2xl pb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
                Search Cafnet
              </p>
              <h1 className="mt-2 text-2xl font-bold text-on-surface md:text-[28px]">
                Tell us what you&apos;re looking for.
              </h1>
              <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                Search restaurants, cafés, cuisines, dishes (like Tibs, Kitfo, Shiro), or places around you.
              </p>
              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
                  Popular searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularSearches.map((item) => (
                    <Link
                      key={item.query}
                      href={`/search?q=${encodeURIComponent(item.query)}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3.5 py-1.5 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="material-symbols-outlined text-[16px] text-secondary" aria-hidden="true">
                        search
                      </span>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
