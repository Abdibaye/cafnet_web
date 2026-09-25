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
               className="group rounded-2xl bg-surface-container-lowest border border-surface-container-low hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col sm:flex-row"
             >
               <div className="w-full sm:w-48 shrink-0 h-48 sm:h-48 bg-surface-container-low">
                 <img
                   alt={`${item.name}`}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   src={item.image}
                 />
               </div>
               <div className="flex-1 min-w-0 p-5 flex flex-col">
                 <div className="flex items-start justify-between mb-3">
                   <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                       {item.name}
                     </h3>
                     <div className="flex items-center gap-3 mt-1.5">
                       <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                         location_on
                       </span>
                       <span className="text-sm text-on-surface-variant truncate">{item.location}</span>
                     </div>
                   </div>
                   <button className="p-2 rounded-full hover:bg-surface-container-lowest transition-colors text-on-surface-variant hover:text-primary">
                     <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
                   </button>
                 </div>
                 <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{item.description}</p>
                 <div className="flex items-center justify-between mt-auto pt-4">
                   <div className="flex items-center gap-2">
                     <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-fixed/20 text-secondary font-bold text-sm">
                       <span
                         className="material-symbols-outlined text-[16px] text-secondary"
                         style={{ fontVariationSettings: "'FILL' 1" }}
                       >
                         star
                       </span>
                       <span>{item.rating}</span>
                     </div>
                     <span className="text-xs text-on-surface-variant">({item.reviews} reviews)</span>
                   </div>
                 </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}
