"use client";

import Link from "next/link";
import BusinessCard, { type BusinessCardItem } from "@/components/BusinessCard";

interface CategoryListProps {
  items: BusinessCardItem[];
  categoryName: string;
  viewAllLink: string;
  activeTab?: string;
  heading?: string;
  viewAllLabel?: string;
}

function EmptyState() {
  return (
    <div className="border border-outline-variant bg-white px-6 py-10 text-center">
      <h2 className="text-lg font-bold text-on-surface">No places found</h2>
      <p className="mt-2 text-sm text-on-surface-variant">We couldn&apos;t find places in this category yet.</p>
      <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-[#0f46b8]" href="/explore">
        Explore all places
        <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
      </Link>
    </div>
  );
}

export default function CategoryList({ items, categoryName, viewAllLink, activeTab, heading, viewAllLabel }: CategoryListProps) {
  const displayName = activeTab || categoryName;

  return (
    <section className="brand-section bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface md:text-[28px]">{heading || `Popular ${displayName} near you`}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-[#0f46b8] sm:inline-flex"
              href={viewAllLink}
            >
              {viewAllLabel || `View All ${categoryName}`}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => <BusinessCard key={item.id} item={item} />)}
          </div>
        ) : <EmptyState />}
      </div>
    </section>
  );
}
