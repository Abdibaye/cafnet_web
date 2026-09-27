import Link from "next/link";
import BusinessCard from "@/components/BusinessCard";

const restaurants = [
  {
    id: 1,
    name: "Yod Abyssinia Cultural Restaurant",
    image: "/images/placeholder1.jpeg",
    location: "Bole Medhanialem, 280m",
    description: "Authentic Habesha, Cultural Dining, Live Music",
    rating: 9.6,
    reviews: 1240,
    tags: ["Credit card accepted", "Wi-Fi available", "Live cultural show", "Fasting menu"],
  },
  {
    id: 2,
    name: "Kaffa Coffee Roastery & Bistro",
    image: "/images/placeholder2.jpeg",
    location: "Kazanchis, 150m",
    description: "Specialty Buna, Artisan Cafe, Bakery & Brunch",
    rating: 9.5,
    reviews: 890,
    tags: ["Single-origin beans", "Card & Telebirr", "Work-friendly", "Outdoor patio"],
  },
  {
    id: 3,
    name: "The Wood Oven Trattoria",
    image: "/images/placeholder3.jpeg",
    location: "Bole Atlas, 420m",
    description: "Woodfired Pizza, Handcrafted Pasta, Wine Bar",
    rating: 9.4,
    reviews: 620,
    tags: ["Credit card accepted", "Non-smoking", "Cocktail lounge", "Reservations recommended"],
  },
   {
     id: 4,
     name: "Tana Fresh Fish & Dullet House",
     image: "/images/placeholder4.jpeg",
     location: "Old Airport, 310m",
     description: "Lake Tana Tilapia, Seafood, Asa Dullet",
     rating: 9.3,
     reviews: 512,
     tags: ["Daily fresh catch", "Fasting vegan options", "Family friendly", "Parking available"],
   },
   {
     id: 5,
     name: "Burger Haven",
     image: "/images/burgre.jpg",
     location: "Bole, 500m",
     description: "Gourmet Burgers, Fries, Shakes",
     rating: 9.2,
     reviews: 480,
     tags: ["Credit card accepted", "Wi-Fi available", "Family friendly", "Outdoor seating"],
   },
   {
     id: 6,
     name: "Pizza Paradise",
     image: "/images/pizza.jpg",
     location: "Kazanchis, 200m",
     description: "Woodfired Pizza, Pasta, Salads",
     rating: 9.1,
     reviews: 450,
     tags: ["Credit card accepted", "Non-smoking", "Delivery available", "Vegan options"],
   },
];

export default function FeaturedRestaurants() {
  return (
    <section className="brand-section bg-background">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mt-1 flex-wrap"></div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden sm:inline-flex items-center gap-2 text-primary hover:text-[#0f46b8] font-bold text-sm"
              href="/restaurants"
            >
              View All Restaurant Around You
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

         <div className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2">
           {restaurants.map((restaurant) => (
             <BusinessCard key={restaurant.id} item={restaurant} />
           ))}
         </div>
      </div>
    </section>
  );
}
