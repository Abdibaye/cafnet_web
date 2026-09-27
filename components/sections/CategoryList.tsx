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
    <section className="brand-section bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">Popular {displayName} near you</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden sm:inline-flex items-center gap-2 text-primary hover:text-[#0f46b8] font-bold text-sm"
              href={viewAllLink}
            >
              View All {categoryName}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
           {items.map((item) => (
             <Link
               key={item.id}
               href={`/business/${item.id}`}
               className="group bg-white rounded-xl overflow-hidden transition-transform duration-300 hover:-translate-y-1"
             >
               <div className="w-full h-56 bg-surface-container-low overflow-hidden">
                 <img
                   alt={`${item.name}`}
                   className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                   src={item.image}
                 />
               </div>
               <div className="flex-1 min-w-0 p-5 flex flex-col">
                 <div className="flex items-start justify-between gap-4 mb-3">
                   <div className="flex-1 min-w-0">
                     <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                       {item.name}
                     </h3>
                     <div className="flex items-center gap-1.5 mt-2">
                       <span className="material-symbols-outlined text-[16px] text-secondary">
                         location_on
                       </span>
                       <span className="text-sm text-on-surface-variant truncate">{item.location}</span>
                     </div>
                   </div>
                   <button className="p-1 text-on-surface-variant hover:text-secondary transition-colors" aria-label={`Save ${item.name}`}>
                     <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
                   </button>
                 </div>
                 <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{item.description}</p>
                 <div className="flex items-center justify-between mt-auto pt-2">
                   <div className="flex items-center gap-2">
                     <div className="inline-flex items-center gap-1 text-secondary font-bold text-sm">
                       <span className="material-symbols-outlined text-[16px]" data-filled="true">
                         star
                       </span>
                       <span>{item.rating}</span>
                     </div>
                     <span className="text-xs text-on-surface-variant">({item.reviews} reviews)</span>
                   </div>
                   <span className="text-xs font-semibold text-primary">{item.tags[0]}</span>
                 </div>
               </div>
             </Link>
           ))}
        </div>
      </div>
    </section>
  );
}
