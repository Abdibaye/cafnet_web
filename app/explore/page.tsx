import type { Metadata } from "next";
import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import ExploreUpdatesFeed from "@/components/sections/ExploreUpdatesFeed";
import { listBusinesses } from "@/lib/api/businesses";
import { businessToCardItem } from "@/lib/api/adapters";

export const metadata: Metadata = {
  title: "Explore — Cafnet",
  description: "Discover the best restaurants, cafés, and drinks spots in Addis Ababa.",
};

function BusinessSection({
  heading,
  supportingText,
  items,
}: {
  heading: string;
  supportingText: string;
  items: BusinessCardItem[];
}) {
  return (
    <section className="brand-section bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-bold text-on-surface md:text-[28px]">{heading}</h2>
            <p className="mt-2 text-sm text-on-surface-variant">{supportingText}</p>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-[#0f46b8]"
            href="/restaurants"
          >
            View all{" "}
            <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
              arrow_forward
            </span>
          </Link>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <BusinessCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-outline-variant bg-white px-6 py-10 text-center">
            <h3 className="text-base font-bold text-on-surface">No places listed yet</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              Be the first to list your restaurant or cafe on Cafnet!
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

export default async function ExplorePage() {
  let popularPlaces: BusinessCardItem[] = [];
  let newPlaces: BusinessCardItem[] = [];

  try {
    const res = await listBusinesses({ limit: 50 });
    if (res.businesses && res.businesses.length > 0) {
      const featured = res.businesses.filter((b) => b.is_featured);
      const standard = res.businesses.filter((b) => !b.is_featured);

      if (featured.length > 0) {
        popularPlaces = featured.map((b) => businessToCardItem(b));
      } else {
        popularPlaces = res.businesses.slice(0, 6).map((b) => businessToCardItem(b));
      }

      if (standard.length > 0) {
        newPlaces = standard.slice(0, 3).map((b) => businessToCardItem(b));
      }
    }
  } catch {
    popularPlaces = [];
    newPlaces = [];
  }

  return (
    <div className="w-full bg-background">
      <section className="mx-auto max-w-7xl px-6 pb-2 pt-12 lg:px-12 lg:pt-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
          Cafnet Explore
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface md:text-[42px]">
          Explore
        </h1>
        <p className="mt-3 text-base text-on-surface-variant">
          Discover what&apos;s happening around you.
        </p>
      </section>
      <SearchBar variant="explore" />
      <TrustStrip />
      <section className="brand-section bg-background pt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              Fresh from local places
            </p>
            <h2 className="text-2xl font-bold text-on-surface md:text-[30px]">
              What&apos;s happening
            </h2>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              New menus, offers, and events worth making a plan for.
            </p>
          </div>
          <ExploreUpdatesFeed />
        </div>
      </section>
      <BusinessSection
        heading="Popular near you"
        supportingText="Places people are discovering around Bole."
        items={popularPlaces}
      />
      <BusinessSection
        heading="New on Cafnet"
        supportingText="Recently added places worth discovering."
        items={newPlaces}
      />
      <section className="brand-section bg-surface-container-low">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-on-surface md:text-[28px]">
              From places you follow
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Get updates when your favorite places have something new.
            </p>
          </div>
          <div className="border border-outline-variant/70 bg-white px-6 py-8 sm:px-8">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="material-symbols-outlined mt-0.5 text-2xl text-secondary" aria-hidden="true">
                  bookmark
                </span>
                <div>
                  <h3 className="font-semibold text-on-surface">Follow your favorite places</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Get updates when they have something new.
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#0f46b8]"
                href="/restaurants"
              >
                Discover places{" "}
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="brand-section bg-background">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-on-surface md:text-[28px]">
              Explore by cuisine
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Start with a flavor, then find your next place.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              "Ethiopian",
              "Italian",
              "Asian",
              "Indian",
              "Middle Eastern",
              "Fast Food",
              "Bakery",
              "Coffee",
            ].map((cuisine) => (
              <Link
                key={cuisine}
                href="/cuisines"
                className="group flex items-center justify-between border border-outline-variant/70 bg-white px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
              >
                {cuisine}
                <span
                  className="material-symbols-outlined text-[18px] text-outline transition-colors group-hover:text-primary"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
