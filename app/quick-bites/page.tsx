import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";

const quickBites = [
  {
    id: 1,
    name: "Snack Attack",
    image: "/images/placeholder1.jpeg",
    location: "Bole, 100m",
    description: "Quick Snacks, Sandwiches, Fast Service",
    rating: 9.0,
    reviews: 720,
    tags: ["Takeaway", "Wi-Fi available", "Vegan options", "Family friendly"],
  },
  {
    id: 2,
    name: "Bite Me",
    image: "/images/placeholder2.jpeg",
    location: "Kazanchis, 120m",
    description: "Burgers, Wraps, Healthy Bites",
    rating: 8.9,
    reviews: 650,
    tags: ["Credit card accepted", "Non-smoking", "Delivery available", "Outdoor seating"],
  },
  {
    id: 3,
    name: "Quick Bite Café",
    image: "/images/placeholder3.jpeg",
    location: "Old Airport, 180m",
    description: "Light Meals, Pastries, Coffee",
    rating: 8.8,
    reviews: 580,
    tags: ["Card & Telebirr", "Work-friendly", "Parking available", "Pet-friendly"],
  },
  {
    id: 4,
    name: "Grab & Go",
    image: "/images/placeholder4.jpeg",
    location: "Bole Atlas, 200m",
    description: "On-the-Go Meals, Salads, Drinks",
    rating: 8.7,
    reviews: 520,
    tags: ["Takeaway", "Wi-Fi available", "Vegan options", "Family friendly"],
  },
];

export default function QuickBitesPage() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList items={quickBites} categoryName="Quick Bites" viewAllLink="/quick-bites" activeTab="Quick Bites" />
    </div>
  );
}
