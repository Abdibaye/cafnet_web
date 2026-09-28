import type { Metadata } from "next";
import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import { getBusinessesByCategory, toBusinessCardItem } from "@/data/mockBusinesses";

export const metadata: Metadata = {
  title: "Drinks & More — Cafnet",
  description: "Discover juice bars, lounges, and drinks spots in Addis Ababa.",
};

export default function DrinksPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={getBusinessesByCategory("drinks").map(toBusinessCardItem)} categoryName="Drinks & More" viewAllLink="/drinks" activeTab="Drinks & More" />
    </div>
  );
}
