"use client";

import { useState, useEffect } from "react";
import { getBusinessMenu, type BusinessMenu } from "@/data/menuStorage";

type BusinessProfileMenuSectionProps = {
  businessId: number;
  images: string[];
  initialMenu?: {
    category: string;
    items: {
      name: string;
      price: string;
      description: string;
    }[];
  }[];
};

export default function BusinessProfileMenuSection({
  businessId,
  images,
  initialMenu,
}: BusinessProfileMenuSectionProps) {
  const [menu, setMenu] = useState<BusinessMenu | undefined>(() => getBusinessMenu(businessId));

  useEffect(() => {
    const handleMenuUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ businessId?: number }>;
      if (!customEvent.detail?.businessId || customEvent.detail.businessId === businessId) {
        setMenu(getBusinessMenu(businessId));
      }
    };

    window.addEventListener("cafnet:menu-updated", handleMenuUpdate);
    return () => window.removeEventListener("cafnet:menu-updated", handleMenuUpdate);
  }, [businessId]);

  const activeCategories = (initialMenu && initialMenu.length > 0)
    ? initialMenu.map((c, i) => ({
        id: String(i),
        name: c.category,
        items: c.items.map((it, j) => ({
          id: `${i}-${j}`,
          name: it.name,
          price: it.price,
          description: it.description,
        })),
      }))
    : (menu?.categories || []).filter((cat) => cat.items.length > 0);

  if (activeCategories.length === 0) {
    return (
      <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">
        Menu details are not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeCategories.map((category, categoryIndex) => (
        <div key={category.id || category.name}>
          <h3 className="mb-3 text-base font-bold text-on-surface">{category.name}</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {category.items.map((item, itemIndex) => (
              <article
                key={item.id || item.name}
                className="flex gap-3 rounded-[14px] border border-outline-variant/80 bg-white p-3"
              >
                {images.length > 0 && (
                  <img
                    src={images[(categoryIndex * 2 + itemIndex) % images.length]}
                    alt=""
                    className="size-20 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 py-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-on-surface">{item.name}</h4>
                    <span className="shrink-0 text-sm font-semibold text-primary">{item.price}</span>
                  </div>
                  {item.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
