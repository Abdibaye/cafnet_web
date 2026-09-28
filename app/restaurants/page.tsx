import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import { getBusinessesByCategory, toBusinessCardItem } from "@/data/mockBusinesses";

export const metadata: Metadata = {
  title: "Restaurants — Cafnet",
  description: "Find the best restaurants in Addis Ababa.",
};

export default function RestaurantsPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={getBusinessesByCategory("restaurant").map(toBusinessCardItem)} categoryName="Restaurants" viewAllLink="/restaurants" activeTab="Restaurants" />
    </div>
  );
}
