"use client";

import Link from "next/link";

interface Item {
  id: number;
  name: string;
  image: string;
  location: string;
  description: string;
  rating: number;
  reviews: number;
  tags: string[];
}

interface CategoryListProps {
  items: Item[];
  categoryName: string;
  viewAllLink: string;
  activeTab?: string;
}

export default function CategoryList({ items, categoryName, viewAllLink, activeTab }: CategoryListProps) {
  const displayName = activeTab || categoryName;

  return (
    <section className="py-16 bg-surface-container-lowest border-b border-surface-container">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Popular {displayName} near you</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden sm:inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] font-label-md font-bold hover:underline text-sm"
              href={viewAllLink}
            >
              View All {categoryName}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/business/${item.id}`}
              className="group rounded-2xl bg-surface-container-lowest border border-surface-container p-4 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4"
            >
              <div className="w-full sm:w-40 shrink-0 h-40 sm:h-40 rounded-xl overflow-hidden bg-surface-container">
                <img
                  alt={`${item.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={item.image}
                />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-[#2563EB] transition-colors truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {item.location} / {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E05A47]/15 text-[#E05A47] font-bold text-xs">
                      <span
                        className="material-symbols-outlined text-[15px] text-[#E05A47]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span>{item.rating}</span>
                      <span className="text-[11px] font-normal text-on-surface-variant">/ 10</span>
                    </div>
                    <span className="text-on-surface-variant text-xs">({item.reviews} reviews)</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-container/60">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 rounded border border-surface-container-high text-[11px] text-on-surface-variant font-medium bg-surface-container-lowest"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
