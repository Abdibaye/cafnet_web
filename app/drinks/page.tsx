import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";

const drinks = [
  {
    id: 1,
    name: "Cocktail Lounge",
    image: "/images/placeholder1.jpeg",
    location: "Bole, 150m",
    description: "Signature Cocktails, Mocktails, Fine Spirits",
    rating: 9.5,
    reviews: 1100,
    tags: ["Credit card accepted", "Non-smoking", "Live music", "Outdoor patio"],
  },
  {
    id: 2,
    name: "Wine & Dine",
    image: "/images/placeholder2.jpeg",
    location: "Kazanchis, 200m",
    description: "Premium Wines, Craft Beers, Cheese Platter",
    rating: 9.3,
    reviews: 950,
    tags: ["Card & Telebirr", "Work-friendly", "Reservations recommended", "Parking available"],
  },
  {
    id: 3,
    name: "Juice Bar",
    image: "/images/placeholder3.jpeg",
    location: "Old Airport, 100m",
    description: "Fresh Juices, Smoothies, Healthy Drinks",
    rating: 9.2,
    reviews: 820,
    tags: ["Wi-Fi available", "Vegan options", "Family friendly", "Takeaway"],
  },
  {
    id: 4,
    name: "Coffee & Tea House",
    image: "/images/placeholder4.jpeg",
    location: "Bole Atlas, 250m",
    description: "Specialty Coffee, Herbal Teas, Relaxing Vibes",
    rating: 9.1,
    reviews: 780,
    tags: ["Single-origin beans", "Non-smoking", "Work-friendly", "Outdoor seating"],
  },
];

export default function DrinksPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={drinks} categoryName="Drinks & More" viewAllLink="/drinks" activeTab="Drinks & More" />
    </div>
  );
}
