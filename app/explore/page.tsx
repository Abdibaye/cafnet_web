import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";
import BusinessUpdateCard, { type BusinessUpdate } from "@/components/BusinessUpdateCard";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";

const updates: BusinessUpdate[] = [
  { businessId: 1, businessName: "Yod Abyssinia Cultural Restaurant", businessImage: "/images/placeholder1.jpeg", updateType: "Event", title: "Live cultural show tonight", description: "Traditional music, dance, and a dinner menu from 7pm.", createdAt: "2h ago", location: "Bole · Today" },
  { businessId: 2, businessName: "Kaffa Coffee Roastery & Bistro", businessImage: "/images/placeholder2.jpeg", updateType: "New menu", title: "New seasonal coffee menu", description: "Try the new Guji pour-over and spiced honey latte.", createdAt: "2h ago", location: "Kazanchis" },
  { businessId: 5, businessName: "Burger Haven", businessImage: "/images/burgre.jpg", updateType: "Offer", title: "20% off lunch combos this week", description: "A quick lunch with a burger, fries, and a soft drink.", createdAt: "Yesterday", location: "Bole · This week" },
];

const popularPlaces: BusinessCardItem[] = [
  { id: 1, name: "Yod Abyssinia Cultural Restaurant", image: "/images/placeholder1.jpeg", location: "Bole Medhanialem, 280m", description: "Authentic Habesha, Cultural Dining, Live Music", rating: 9.6, reviews: 1240, tags: ["Credit card accepted", "Live cultural show", "Fasting menu"] },
  { id: 2, name: "Kaffa Coffee Roastery & Bistro", image: "/images/placeholder2.jpeg", location: "Kazanchis, 150m", description: "Specialty Buna, Artisan Cafe, Bakery & Brunch", rating: 9.5, reviews: 890, tags: ["Single-origin beans", "Work-friendly", "Outdoor patio"] },
  { id: 5, name: "Burger Haven", image: "/images/burgre.jpg", location: "Bole, 500m", description: "Gourmet Burgers, Fries, Shakes", rating: 9.2, reviews: 480, tags: ["Family friendly", "Outdoor seating", "Lunch favorite"] },
];

const newPlaces: BusinessCardItem[] = [
  { id: 6, name: "Pizza Paradise", image: "/images/pizza.jpg", location: "Kazanchis, 200m", description: "Woodfired Pizza, Pasta, Salads", rating: 9.1, reviews: 450, tags: ["Delivery available", "Vegan options", "Woodfired"] },
  { id: 3, name: "The Wood Oven Trattoria", image: "/images/placeholder3.jpeg", location: "Bole Atlas, 420m", description: "Woodfired Pizza, Handcrafted Pasta, Wine Bar", rating: 9.4, reviews: 620, tags: ["Cocktail lounge", "Reservations recommended", "Italian"] },
  { id: 4, name: "Tana Fresh Fish & Dullet House", image: "/images/placeholder4.jpeg", location: "Old Airport, 310m", description: "Lake Tana Tilapia, Seafood, Asa Dullet", rating: 9.3, reviews: 512, tags: ["Daily fresh catch", "Family friendly", "Fasting options"] },
];

function BusinessSection({ heading, supportingText, items }: { heading: string; supportingText: string; items: BusinessCardItem[] }) {
  return (
    <section className="brand-section bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h2 className="text-2xl font-bold text-on-surface md:text-[28px]">{heading}</h2><p className="mt-2 text-sm text-on-surface-variant">{supportingText}</p></div>
          <Link className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-[#0f46b8]" href="/restaurants">View all <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span></Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <BusinessCard key={item.id} item={item} />)}</div>
      </div>
    </section>
  );
}

export default function ExplorePage() {
  return (
    <div className="w-full bg-background">
      <section className="mx-auto max-w-7xl px-6 pb-2 pt-12 lg:px-12 lg:pt-16">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Cafnet Explore</p>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface md:text-[42px]">Explore</h1>
        <p className="mt-3 text-base text-on-surface-variant">Discover what&apos;s happening around you.</p>
      </section>
      <SearchBar variant="explore" />
      <TrustStrip />
      <section className="brand-section bg-background pt-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <div className="mb-8 max-w-2xl"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Fresh from local places</p><h2 className="text-2xl font-bold text-on-surface md:text-[30px]">What&apos;s happening</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">New menus, offers, and events worth making a plan for.</p></div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{updates.map((update, index) => <BusinessUpdateCard key={update.title} update={update} featured={index === 0} />)}</div>
        </div>
      </section>
      <BusinessSection heading="Popular near you" supportingText="Places people are discovering around Bole." items={popularPlaces} />
      <BusinessSection heading="New on Cafnet" supportingText="Recently added places worth discovering." items={newPlaces} />
      <section className="brand-section bg-surface-container-low"><div className="mx-auto max-w-7xl px-6 lg:px-12"><div className="mb-8"><h2 className="text-2xl font-bold text-on-surface md:text-[28px]">From places you follow</h2><p className="mt-2 text-sm text-on-surface-variant">Get updates when your favorite places have something new.</p></div><div className="border border-outline-variant/70 bg-white px-6 py-8 sm:px-8"><div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><span className="material-symbols-outlined mt-0.5 text-2xl text-secondary" aria-hidden="true">bookmark</span><div><h3 className="font-semibold text-on-surface">Follow your favorite places</h3><p className="mt-1 text-sm text-on-surface-variant">Get updates when they have something new.</p></div></div><Link className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#0f46b8]" href="/restaurants">Discover places <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span></Link></div></div></div></section>
      <section className="brand-section bg-background"><div className="mx-auto max-w-7xl px-6 lg:px-12"><div className="mb-7"><h2 className="text-2xl font-bold text-on-surface md:text-[28px]">Explore by cuisine</h2><p className="mt-2 text-sm text-on-surface-variant">Start with a flavor, then find your next place.</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{["Ethiopian", "Italian", "Asian", "Indian", "Middle Eastern", "Fast Food", "Bakery", "Coffee"].map((cuisine) => <Link key={cuisine} href="/cuisines" className="group flex items-center justify-between border border-outline-variant/70 bg-white px-4 py-4 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary">{cuisine}<span className="material-symbols-outlined text-[18px] text-outline transition-colors group-hover:text-primary" aria-hidden="true">arrow_forward</span></Link>)}</div></div></section>
    </div>
  );
}
