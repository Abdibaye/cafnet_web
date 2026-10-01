import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import type { BusinessCardItem } from "@/components/BusinessCard";
import { listBusinesses } from "@/lib/api/businesses";
import { businessToCardItem } from "@/lib/api/adapters";

export const metadata: Metadata = {
  title: "Cafés — Cafnet",
  description: "Explore top cafés and coffee shops in Addis Ababa.",
};

export default async function CafesPage() {
  let items: BusinessCardItem[] = [];

  try {
    const res = await listBusinesses({ category: "cafe", limit: 50 });
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
        categoryName="Cafés"
        viewAllLink="/cafes"
        activeTab="Cafés"
      />
    </div>
  );
}
