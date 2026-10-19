import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import type { BusinessCardItem } from "@/components/BusinessCard";
import { listBusinesses } from "@/lib/api/businesses";
import { businessToCardItem } from "@/lib/api/adapters";

export const metadata: Metadata = {
  title: "Restaurants — Cafnet",
  description: "Find the best restaurants in Addis Ababa.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RestaurantsPage() {
  let items: BusinessCardItem[] = [];

  try {
    const res = await listBusinesses({ category: "restaurant", limit: 50 });
    if (res.businesses && res.businesses.length > 0) {
      items = res.businesses.map((b) => businessToCardItem(b));
    }
  } catch {
    items = [];
  }

  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList
        items={items}
        categoryName="Restaurants"
        viewAllLink="/restaurants"
        activeTab="Restaurants"
      />
    </div>
  );
}
