import HeroSection from "@/components/sections/HeroSection";
import TrustStrip from "@/components/sections/TrustStrip";
import FeaturedRestaurants from "@/components/sections/FeaturedRestaurants";
import KitchensFeed from "@/components/sections/KitchensFeed";
import PartnerBanner from "@/components/sections/PartnerBanner";

export default function Home() {
  return (
    <div className="w-full bg-background">
      <HeroSection />
      <TrustStrip />
      <FeaturedRestaurants />
      <KitchensFeed />
      <PartnerBanner />
    </div>
  );
}
