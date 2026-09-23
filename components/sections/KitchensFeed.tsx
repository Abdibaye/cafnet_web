"use client";

import { useRef } from "react";

const feedItems = [
  {
    id: 1,
    restaurant: "Yod Abyssinia Cultural Restaurant",
    location: "Bole Medhanialem • Verified Partner",
    image: "/images/placeholder1.jpeg",
    description: "Watch Chef Almaz prepare our signature dry-aged Shekla Tibs sizzling with fresh rosemary sprigs and fiery berbere over live coals!",
    reactions: 58,
    views: 1400,
    color: "#2563EB",
  },
  {
    id: 2,
    restaurant: "The Wood Oven Trattoria",
    location: "Bole Atlas • Italian & Bistro",
    image: "/images/placeholder2.jpeg",
    description: "Happy hour dinner kick-off! 25% off all artisan wood-fired truffle pizzas & house sangria pitchers for tables seated before 7:30 PM.",
    claimed: 89,
    color: "#E05A47",
  },
  {
    id: 3,
    restaurant: "Blue Nile Lake Fish Market",
    location: "Kazanchis • Lake Specialties",
    image: "/images/placeholder3.jpeg",
    description: "Watch the morning haul from Lake Tana get prepped, seasoned with spiced mitmita, and fried crisp for lunch platters in under 15 minutes!",
    watchers: 84,
    views: 2100,
    color: "#E05A47",
  },
  {
    id: 4,
    restaurant: "Kaffa Coffee Roastery & Bistro",
    location: "Kazanchis • Specialty Buna",
    image: "/images/placeholder4.jpeg",
    description: "Unveiling our Single-Origin Honey-Processed Sidama Bensa micro-lot roast! Served with traditional Jebena ceremony and local sweet kitta.",
    saved: 61,
    color: "#2563EB",
  },
  {
    id: 5,
    restaurant: "Bean & Leaf Lounge & Bakery",
    location: "Bole Medhanialem • Bakery & Cafe",
    image: "/images/placeholder1.jpeg",
    description: "Fresh evening bake just came out of the deck oven: Cardamom croissants and pistachio babka slices. Buy 2 get 1 complimentary until stock clears.",
    notified: 112,
    color: "#2563EB",
  },
];

export default function KitchensFeed() {
  const scrollContainer = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollContainer.current) {
      scrollContainer.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 border-t border-surface-container bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2"></div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1">
              <button
                className="w-9 h-9 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
                title="Scroll Left"
                type="button"
                onClick={scrollLeft}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button
                className="w-9 h-9 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
                title="Scroll Right"
                type="button"
                onClick={scrollRight}
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollContainer}
          className="flex gap-6 overflow-x-auto pb-4 pt-1 -mx-2 px-2 scroll-smooth"
        >
          {feedItems.map((item) => (
            <article
              key={item.id}
              className="min-w-[320px] max-w-[340px] flex-shrink-0 bg-surface-container-lowest rounded-2xl border border-surface-container hover:border-[#2563EB]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="relative w-full h-48 bg-surface-container overflow-hidden">
                <img
                  alt={`${item.restaurant} update`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={item.image}
                />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface truncate">
                      {item.restaurant}
                    </h4>
                    <p className="text-[11px] text-on-surface-variant truncate">{item.location}</p>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">{item.description}</p>
                </div>
                <div className="mt-5 pt-3.5 border-t border-surface-container flex items-center justify-between text-xs">
                  {item.reactions && (
                    <span className="text-on-surface-variant text-[11px]">{item.reactions} reactions</span>
                  )}
                  {item.claimed && (
                    <span className="text-on-surface-variant text-[11px]">{item.claimed} claimed</span>
                  )}
                  {item.watchers && (
                    <span className="text-on-surface-variant text-[11px]">{item.watchers} diners watching</span>
                  )}
                  {item.saved && (
                    <span className="text-on-surface-variant text-[11px]">{item.saved} coffee lovers saved</span>
                  )}
                  {item.notified && (
                    <span className="text-on-surface-variant text-[11px]">{item.notified} notified</span>
                  )}
                  {item.views && (
                    <span className="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px] text-[#2563EB]">visibility</span>
                      {item.views} views
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
