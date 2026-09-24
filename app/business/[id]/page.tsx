import Link from "next/link";
import BusinessImageGallery from "@/components/BusinessImageGallery";

const business = {
  id: 1,
  name: "Yod Abyssinia Cultural Restaurant",
  rating: 9.6,
  reviews: 1240,
  nearestPlace: "Bole Medhanialem, 280m from Addis Ababa Stadium",
  averagePrice: "$$$",
  description: "Authentic Habesha cultural dining experience with live traditional music and dance performances. Specializing in traditional Ethiopian cuisine with a modern twist, offering a wide variety of dishes from different regions of Ethiopia.",
  images: [
    "/images/placeholder1.jpeg",
    "/images/placeholder2.jpeg",
    "/images/placeholder3.jpeg",
    "/images/placeholder4.jpeg",
    "/images/placeholder1.jpeg",
    "/images/placeholder2.jpeg",
  ],
  menu: [
    {
      category: "Traditional Dishes",
      items: [
        { name: "Doro Wat", price: "250 ETB", description: "Spicy chicken stew with berbere" },
        { name: "Tibs Firfir", price: "320 ETB", description: "Minced beef with injera" },
        { name: "Kitfo", price: "280 ETB", description: "Spiced minced beef" },
        { name: "Tere Siga", price: "350 ETB", description: "Raw beef special" },
      ],
    },
    {
      category: "Vegetarian",
      items: [
        { name: "Shiro Wat", price: "120 ETB", description: "Chickpea stew" },
        { name: "Atakilt Wat", price: "140 ETB", description: "Cabbage, carrot and potato stew" },
        { name: "Gomen", price: "130 ETB", description: "Collard greens" },
        { name: "Kik Alicha", price: "150 ETB", description: "Mild split pea stew" },
      ],
    },
    {
      category: "Drinks",
      items: [
        { name: "Tej", price: "80 ETB", description: "Honey wine" },
        { name: "Tella", price: "60 ETB", description: "Traditional beer" },
        { name: "Coffee", price: "40 ETB", description: "Ethiopian coffee ceremony" },
        { name: "Soft Drinks", price: "30 ETB", description: "Various soft drinks" },
      ],
    },
  ],
   reviewList: [
    {
      id: 1,
      user: "Abebe K.",
      rating: 5,
      date: "2 weeks ago",
      comment: "Amazing cultural experience! The food was delicious and the live music was fantastic. Highly recommend for anyone visiting Addis Ababa.",
    },
    {
      id: 2,
      user: "Mearg T.",
      rating: 4,
      date: "1 month ago",
      comment: "Great food and atmosphere. The service was a bit slow but the cultural show made up for it. Will definitely come back.",
    },
    {
      id: 3,
      user: "Sara W.",
      rating: 5,
      date: "3 weeks ago",
      comment: "Best traditional Ethiopian food I've had in Addis. The injera was perfect and the portions were generous. Loved the live music!",
    },
    {
      id: 4,
      user: "Dawit A.",
      rating: 4,
      date: "2 months ago",
      comment: "Excellent place for group dining. The variety of dishes is impressive. The only downside is that it can get quite crowded.",
    },
  ],
  tags: ["Credit card accepted", "Wi-Fi available", "Live cultural show", "Fasting menu", "Parking available", "Family friendly"],
  address: "Bole Medhanialem, Addis Ababa, Ethiopia",
  phone: "+251 11 555 1234",
  hours: "10:00 AM - 11:00 PM",
};

export default function BusinessProfile() {
  return (
    <div className="w-full">
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          {/* Business name and rating section */}
          <div className="mb-6">
            <h1 className="font-headline-lg text-xl font-bold text-on-surface truncate">{business.name}</h1>
            <div className="flex items-center gap-4 text-sm text-on-surface-variant mt-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary-fixed/20 text-secondary font-bold text-lg">
                <span
                  className="material-symbols-outlined text-[20px] text-secondary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
                <span>{business.rating}</span>
                <span className="text-sm font-normal text-on-surface-variant">/ 10</span>
              </div>
              <span className="text-on-surface-variant">({business.reviews} reviews)</span>
              <span className="text-on-surface-variant">Price range: 300 ETB - 900 ETB</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-on-surface-variant mt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">location_on</span>
                <span>{business.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">near_me</span>
                <span>{business.nearestPlace}</span>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left column - Images */}
           <div className="lg:col-span-2">
             {/* Main image gallery */}
             <BusinessImageGallery images={business.images} businessName={business.name} />

            {/* Business info section */}
            <section className="mb-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h2 className="font-headline-md text-lg font-bold text-on-surface mb-4">About {business.name}</h2>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{business.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">schedule</span>
                      <span className="text-on-surface-variant">{business.hours}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">call</span>
                      <span className="text-on-surface-variant">{business.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                      <span className="text-on-surface-variant">{business.address}</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-headline-sm text-base font-bold text-on-surface mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full border border-surface-container-high text-[12px] text-on-surface-variant font-medium bg-surface-container-lowest"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="md:w-64">
                  <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary-fixed/20 text-secondary font-bold text-lg">
                        <span
                          className="material-symbols-outlined text-[20px] text-secondary"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span>{business.rating}</span>
                        <span className="text-sm font-normal text-on-surface-variant">/ 10</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1">{business.reviews} reviews</p>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">attach_money</span>
                        <span className="text-on-surface-variant">Average Price: {business.averagePrice}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">location_on</span>
                        <span className="text-on-surface-variant">Nearest: {business.nearestPlace.split(',')[0]}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-surface-container/60">
                      <button className="w-full py-2 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined text-[18px] mr-2">calendar_month</span>
                        Make Reservation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Menu section */}
            <section className="mb-8">
              <h2 className="font-headline-md text-lg font-bold text-on-surface mb-6">Menu</h2>
              <div className="space-y-6">
                {business.menu.map((category, index) => (
                  <div key={index} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container">
                    <h3 className="font-headline-sm text-base font-bold text-on-surface mb-4">{category.category}</h3>
                    <div className="space-y-4">
                      {category.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-4 p-3 rounded-xl hover:bg-surface-container transition-colors">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-on-surface text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary text-sm">{item.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Reviews section */}
            <section>
              <h2 className="font-headline-md text-lg font-bold text-on-surface mb-6">Reviews ({business.reviews})</h2>
              <div className="space-y-4">
                {business.reviewList.map((review) => (
                  <div key={review.id} className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[24px] text-on-surface-variant">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-on-surface text-sm">{review.user}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <div className="inline-flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <span
                                    key={i}
                                    className={`material-symbols-outlined text-[14px] ${i < review.rating ? 'text-secondary' : 'text-outline/30'}`}
                                    style={{ fontVariationSettings: "'FILL' 1" }}
                                  >
                                    star
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-on-surface-variant whitespace-nowrap">{review.date}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column - Quick info and map placeholder */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container sticky top-32">
              <h3 className="font-headline-sm text-base font-bold text-on-surface mb-4">Quick Info</h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
                  <div>
                    <p className="text-on-surface-variant text-xs">Hours</p>
                    <p className="font-semibold text-on-surface">{business.hours}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">call</span>
                  <div>
                    <p className="text-on-surface-variant text-xs">Phone</p>
                    <p className="font-semibold text-on-surface">{business.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                  <div>
                    <p className="text-on-surface-variant text-xs">Address</p>
                    <p className="font-semibold text-on-surface truncate">{business.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px] text-primary">attach_money</span>
                  <div>
                    <p className="text-on-surface-variant text-xs">Price Range</p>
                    <p className="font-semibold text-on-surface">{business.averagePrice}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-container/60">
                <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-3">Location Map</h4>
                <div className="bg-surface-container rounded-xl h-48 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[48px] text-outline/40">map</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-container/60 space-y-3">
                <button className="w-full py-2 px-4 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-[18px] mr-2">navigation</span>
                  Get Directions
                </button>
                <button className="w-full py-2 px-4 rounded-xl border border-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px] mr-2">share</span>
                  Share
                </button>
                <button className="w-full py-2 px-4 rounded-xl border border-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined text-[18px] mr-2">favorite</span>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
