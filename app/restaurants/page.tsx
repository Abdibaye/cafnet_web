import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";
import { getBusinessesByCategory, toBusinessCardItem } from "@/data/mockBusinesses";

export default function RestaurantsPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={getBusinessesByCategory("restaurant").map(toBusinessCardItem)} categoryName="Restaurants" viewAllLink="/restaurants" activeTab="Restaurants" />
    </div>
  );
}
