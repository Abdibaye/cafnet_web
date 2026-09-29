import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import type { BusinessCardItem } from "@/components/BusinessCard";
import { getBusinessesByCategory, toBusinessCardItem } from "@/data/mockBusinesses";
import { listBusinesses } from "@/lib/api/businesses";
import { businessToCardItem } from "@/lib/api/adapters";

export const metadata: Metadata = {
  title: "Drinks & More — Cafnet",
  description: "Discover juice bars, lounges, and drinks spots in Addis Ababa.",
};

export default async function DrinksPage() {
  let items: BusinessCardItem[] = [];

  try {
    const res = await listBusinesses({ category: "drinks", limit: 50 });
    if (res.businesses && res.businesses.length > 0) {
      items = res.businesses.map((b) => businessToCardItem(b));
    } else {
      items = getBusinessesByCategory("drinks").map(toBusinessCardItem);
    }
  } catch {
    items = getBusinessesByCategory("drinks").map(toBusinessCardItem);
  }

  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList
        items={items}
        categoryName="Drinks & More"
        viewAllLink="/drinks"
        activeTab="Drinks & More"
      />
    </div>
  );
}
