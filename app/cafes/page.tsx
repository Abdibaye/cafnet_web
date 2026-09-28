import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import { getBusinessesByCategory, toBusinessCardItem } from "@/data/mockBusinesses";

export const metadata: Metadata = {
  title: "Cafés — Cafnet",
  description: "Explore top cafés and coffee shops in Addis Ababa.",
};

export default function CafesPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={getBusinessesByCategory("cafe").map(toBusinessCardItem)} categoryName="Cafés" viewAllLink="/cafes" activeTab="Cafés" />
    </div>
  );
}
