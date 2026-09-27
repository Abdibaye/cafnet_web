import SearchBar from "@/components/sections/SearchBar";
import TrustStrip from "@/components/sections/TrustStrip";
import CategoryList from "@/components/sections/CategoryList";

const cuisines = [
  {
    id: 1,
    name: "Italian Trattoria",
    image: "/images/placeholder1.jpeg",
    location: "Bole, 120m",
    description: "Authentic Italian, Woodfired Pizza, Pasta, Risotto",
    rating: 9.7,
    reviews: 1500,
    tags: ["Credit card accepted", "Wi-Fi available", "Family friendly", "Outdoor seating"],
  },
  {
    id: 2,
    name: "Asian Fusion",
    image: "/images/placeholder2.jpeg",
    location: "Kazanchis, 180m",
    description: "Sushi, Noodles, Wok Dishes, Thai Curry",
    rating: 9.5,
    reviews: 1200,
    tags: ["Vegan options", "Non-smoking", "Delivery available", "Reservations recommended"],
  },
  {
    id: 3,
    name: "Mexican Fiesta",
    image: "/images/placeholder3.jpeg",
    location: "Old Airport, 250m",
    description: "Tacos, Burritos, Nachos, Margaritas",
    rating: 9.4,
    reviews: 980,
    tags: ["Card & Telebirr", "Live music", "Parking available", "Happy hour"],
  },
  {
    id: 4,
    name: "Indian Spice House",
    image: "/images/placeholder4.jpeg",
    location: "Bole Atlas, 300m",
    description: "Butter Chicken, Biryani, Naan, Tandoori",
    rating: 9.3,
    reviews: 850,
    tags: ["Wi-Fi available", "Vegan options", "Family friendly", "Takeaway"],
  },
];

export default function Home() {
  return (
    <div className="w-full bg-background">
      <SearchBar />
      <TrustStrip />
      <CategoryList
        items={cuisines}
        categoryName="Cuisines"
        viewAllLink="/cuisines"
        heading="Popular near you"
        viewAllLabel="View all"
      />
    </div>
  );
}
