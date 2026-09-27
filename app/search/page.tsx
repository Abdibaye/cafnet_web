import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";
import SearchBar from "@/components/sections/SearchBar";
import { toBusinessCardItem } from "@/data/mockBusinesses";
import { searchBusinesses } from "@/data/searchBusinesses";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const results = searchBusinesses(query);

  return (
    <div className="w-full bg-background">
      <SearchBar initialQuery={query} />
      <section className="brand-section bg-background pt-2 md:pt-6">
        <div className="mx-auto max-w-7xl px-5 lg:px-12">
          {query ? <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Search</p><h1 className="mt-2 text-2xl font-bold text-on-surface md:text-[28px]">Results for &quot;{query}&quot;</h1></div><p className="text-sm text-on-surface-variant">{results.length} {results.length === 1 ? "place" : "places"} found</p></div>
            {results.length > 0 ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">{results.map((business) => <BusinessCard key={business.id} item={toBusinessCardItem(business)} />)}</div> : <div className="border border-dashed border-outline-variant bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold text-on-surface">No places found for &quot;{query}&quot;</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">Try a different restaurant name, cuisine, neighborhood, or a broader search.</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#0f46b8]" href="/search">Explore popular searches <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span></Link></div>}
          </> : <div className="max-w-2xl pb-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Search Cafnet</p><h1 className="mt-2 text-2xl font-bold text-on-surface md:text-[28px]">Tell us what you&apos;re looking for.</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant">Search restaurants, cafés, cuisines, dishes, or places around Bole.</p></div>}
        </div>
      </section>
    </div>
  );
}
