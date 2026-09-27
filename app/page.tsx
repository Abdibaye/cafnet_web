import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";

const popularPlaces: BusinessCardItem[] = [
  {
    id: 1,
    name: "Yod Abyssinia Cultural Restaurant",
    image: "/images/placeholder1.jpeg",
    location: "Bole Medhanialem, 280m",
    description: "Authentic Habesha, Cultural Dining, Live Music",
    rating: 9.6,
    reviews: 1240,
    tags: ["Credit card accepted", "Live cultural show", "Fasting menu"],
  },
  {
    id: 2,
    name: "Kaffa Coffee Roastery & Bistro",
    image: "/images/placeholder2.jpeg",
    location: "Kazanchis, 150m",
    description: "Specialty Buna, Artisan Cafe, Bakery & Brunch",
    rating: 9.5,
    reviews: 890,
    tags: ["Single-origin beans", "Work-friendly", "Outdoor patio"],
  },
  {
    id: 5,
    name: "Burger Haven",
    image: "/images/burgre.jpg",
    location: "Bole, 500m",
    description: "Gourmet Burgers, Fries, Shakes",
    rating: 9.2,
    reviews: 480,
    tags: ["Family friendly", "Outdoor seating", "Lunch favorite"],
  },
];

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
          {items.map((item) => <BusinessCard key={item.id} item={item} />)}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
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

      <SearchBar variant="homepage" />
      <TrustStrip variant="homepage" />

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
