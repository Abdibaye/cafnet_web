import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";

const cafes = [
  {
    id: 1,
    name: "Mocha Bliss Café",
    image: "/images/cafe/placeholder1.webp",
    location: "Bole, 120m",
    description: "Specialty Coffee, Artisan Pastries, Cozy Atmosphere",
    rating: 9.7,
    reviews: 1500,
    tags: ["Single-origin beans", "Wi-Fi available", "Work-friendly", "Outdoor seating"],
  },
  {
    id: 2,
    name: "Brew Haven",
    image: "/images/cafe/placeholder2.webp",
    location: "Kazanchis, 180m",
    description: "Handcrafted Coffee, Fresh Bakes, Relaxing Vibes",
    rating: 9.5,
    reviews: 1200,
    tags: ["Credit card accepted", "Vegan options", "Non-smoking", "Live music"],
  },
  {
    id: 3,
    name: "Espresso Escape",
    image: "/images/cafe/placeholder3.jpg",
    location: "Old Airport, 250m",
    description: "Premium Coffee, Light Meals, Friendly Service",
    rating: 9.4,
    reviews: 980,
    tags: ["Card & Telebirr", "Family friendly", "Parking available", "Delivery"],
  },
  {
    id: 4,
    name: "Café Latte Lounge",
    image: "/images/cafe/placeholder4.jpeg",
    location: "Bole Atlas, 300m",
    description: "Latte Art, Desserts, Chill Environment",
    rating: 9.3,
    reviews: 850,
    tags: ["Wi-Fi available", "Study-friendly", "Pet-friendly", "Organic ingredients"],
  },
];

export default function CafesPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={cafes} categoryName="Cafés" viewAllLink="/cafes" activeTab="Cafés" />
    </div>
  );
}
