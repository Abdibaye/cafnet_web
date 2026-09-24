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
         { name: "Doro Wat", price: "250 ETB", description: "A signature Ethiopian dish featuring tender chicken pieces cooked in a rich, spicy berbere sauce, served with injera. Slow-cooked to perfection with onions, garlic, and a blend of traditional spices." },
         { name: "Tibs Firfir", price: "320 ETB", description: "A flavorful combination of minced beef (tibs) mixed with shredded injera, simmered in a spicy sauce. Perfect for those who love a mix of textures and bold flavors." },
         { name: "Kitfo", price: "280 ETB", description: "A traditional Ethiopian delicacy made from finely minced beef, seasoned with mitmita (a spicy chili powder blend) and niter kibbeh (spiced clarified butter). Served raw or lightly cooked to your preference." },
         { name: "Tere Siga", price: "350 ETB", description: "A premium dish of raw beef, carefully prepared and seasoned with traditional Ethiopian spices. A must-try for adventurous food lovers seeking an authentic experience." },
         { name: "Gored Gored", price: "380 ETB", description: "Cubed raw beef marinated in spiced clarified butter and served with injera. A traditional dish often enjoyed during special occasions and celebrations." },
         { name: "Tibs", price: "400 ETB", description: "Sizzling beef cubes cooked with onions, peppers, and rosemary, served on a hot plate. A popular choice for meat lovers, offering a smoky and savory flavor." },
       ],
     },
     {
       category: "Vegetarian",
       items: [
         { name: "Shiro Wat", price: "120 ETB", description: "A hearty and creamy chickpea stew, slow-cooked with garlic, onions, and berbere spice. A staple in Ethiopian vegetarian cuisine, rich in flavor and protein." },
         { name: "Atakilt Wat", price: "140 ETB", description: "A vibrant and nutritious dish made with cabbage, carrots, and potatoes, simmered in a light turmeric-infused sauce. A perfect balance of textures and flavors." },
         { name: "Gomen", price: "130 ETB", description: "Tender collard greens cooked with garlic, onions, and a touch of lemon. A simple yet delicious side dish that complements any Ethiopian meal." },
         { name: "Kik Alicha", price: "150 ETB", description: "A mild and comforting split pea stew, cooked with turmeric, garlic, and onions. A great source of protein and a favorite among vegetarians." },
       ],
     },
     {
       category: "Drinks",
       items: [
         { name: "Tej", price: "80 ETB", description: "A traditional Ethiopian honey wine, fermented to perfection with a sweet and slightly tangy flavor. Often served in a unique glass flask called a berele." },
         { name: "Tella", price: "60 ETB", description: "A homemade traditional beer brewed from barley or maize, offering a light and refreshing taste. A popular choice for casual gatherings." },
         { name: "Coffee", price: "40 ETB", description: "Experience the famous Ethiopian coffee ceremony, featuring freshly roasted and brewed coffee served with incense and traditional snacks. A cultural must-try." },
         { name: "Soft Drinks", price: "30 ETB", description: "A variety of refreshing soft drinks, including local and international brands, to complement your meal." },
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
               </div>
             </section>

             {/* Menu section */}
            <section className="mb-8">
              <h2 className="font-headline-md text-lg font-bold text-on-surface mb-6">Set menu</h2>
              <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container">
                <div className="grid grid-cols-2 gap-4">
                  {business.menu[0].items.slice(0, 6).map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-lowest transition-colors">
                      <div className="w-24 h-24 rounded-xl bg-surface-container overflow-hidden shrink-0">
                        <img
                          src={business.images[itemIndex % business.images.length]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-on-surface text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">{item.description}</p>
                        <p className="font-bold text-primary text-xs mt-1">{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button className="px-4 py-2 rounded-xl border border-surface-container text-on-surface font-semibold text-sm hover:bg-surface-container transition-colors">
                    View more
                  </button>
                </div>
              </div>
            </section>

            {/* Reviews section */}
            <section>
              <h2 className="font-headline-md text-lg font-bold text-on-surface mb-6">Reviews ({business.reviews})</h2>
               <div className="space-y-4">
                 {business.reviewList.map((review) => (
                   <div key={review.id} className="flex items-start gap-4 p-3">
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
                 ))}
               </div>
            </section>
          </div>

           {/* Right column - Restaurant information */}
           <div className="lg:col-span-1">
             <div className="bg-surface-container-lowest rounded-2xl p-6 border border-surface-container sticky top-32">
               <h3 className="font-headline-sm text-base font-bold text-on-surface mb-4">Restaurant information</h3>
               
               <div className="space-y-4 text-sm">
                 <div className="flex items-center gap-3">
                   <div>
                     <p className="text-on-surface-variant text-xs">Categories</p>
                     <p className="font-semibold text-on-surface">Traditional, Cultural</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <div>
                     <p className="text-on-surface-variant text-xs">Phone number</p>
                     <p className="font-semibold text-on-surface">{business.phone}</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <div>
                     <p className="text-on-surface-variant text-xs">Payment methods</p>
                     <p className="font-semibold text-on-surface">Cash, Credit Card</p>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                   <div>
                     <p className="text-on-surface-variant text-xs">Transportation</p>
                     <p className="font-semibold text-on-surface">20 minutes from Bole</p>
                   </div>
                 </div>
               </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
