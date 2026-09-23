import Link from "next/link";

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
    <section className="py-16 bg-surface-container-lowest border-b border-surface-container">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mt-1 flex-wrap"></div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              className="hidden sm:inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8] font-label-md font-bold hover:underline text-sm"
              href="/restaurants"
            >
              View All Restaurant Around You
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {restaurants.map((restaurant) => (
               <Link
               key={restaurant.id}
               href={`/business/${restaurant.id}`}
               className="group rounded-2xl bg-surface-container-lowest border border-surface-container hover:border-[#2563EB] p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-5"
             >
                <div className="w-full sm:w-48 shrink-0 h-48 sm:h-48 rounded-xl overflow-hidden bg-surface-container">
                  <img
                    alt={`${restaurant.name} dining`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={restaurant.image}
                  />
                </div>
               <div className="flex-1 min-w-0 flex flex-col justify-between">
                 <div className="space-y-2">
                   <div className="flex items-start gap-2.5">
                     <div className="min-w-0 flex-1">
                       <h3 className="font-headline-sm text-base font-bold text-on-surface group-hover:text-[#2563EB] transition-colors truncate">
                         {restaurant.name}
                       </h3>
                       <p className="text-xs text-on-surface-variant truncate mt-0.5">
                         {restaurant.location} / {restaurant.description}
                       </p>
                     </div>
                   </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E05A47]/15 text-[#E05A47] font-bold text-xs">
                      <span
                        className="material-symbols-outlined text-[15px] text-[#E05A47]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span>{restaurant.rating}</span>
                      <span className="text-[11px] font-normal text-on-surface-variant">/ 10</span>
                    </div>
                    <span className="text-on-surface-variant text-xs">({restaurant.reviews} reviews)</span>
                  </div>
                </div>
                 <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-container/60">
                   {restaurant.tags.map((tag, index) => (
                     <span
                       key={index}
                       className="px-2 py-0.5 rounded border border-surface-container-high text-[11px] text-on-surface-variant font-medium bg-surface-container-lowest"
                     >
                       {tag}
                     </span>
                   ))}
                 </div>
               </div>
             </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
