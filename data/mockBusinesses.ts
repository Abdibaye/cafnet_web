import { getReviewSummary } from "@/data/mockReviews";
export type BusinessCategory = "restaurant" | "cafe" | "drinks";
export type BusinessClaimStatus = "unclaimed" | "pending" | "claimed";

type MenuItem = {
  name: string;
  price: string;
  description: string;
};

type MenuCategory = {
  category: string;
  items: MenuItem[];
};

type Review = {
  id: number;
  user: string;
  rating: number;
  date: string;
  comment: string;
};

export type MockBusiness = {
  id: number;
  name: string;
  category: BusinessCategory;
  cuisine: string;
  location: string;
  neighborhood: string;
  distance: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  description: string;
  shortDescription: string;
  images: string[];
  tags: string[];
  paymentMethods: string[];
  openingHours: string;
  phone: string;
  verified: boolean;
  reservationAvailable: boolean;
  claimStatus?: BusinessClaimStatus;
  featured: boolean;
  isOpen: boolean;
  menu: MenuCategory[];
  updates: {
    type: string;
    title: string;
    description: string;
    createdAt: string;
  }[];
  reviews: Review[];
};

const sharedImages = [
  "/images/placeholder1.jpeg",
  "/images/placeholder2.jpeg",
  "/images/placeholder3.jpeg",
  "/images/placeholder4.jpeg",
];

export const mockBusinesses: MockBusiness[] = [
  {
    id: 1,
    name: "Yod Abyssinia Cultural Restaurant",
    category: "restaurant",
    cuisine: "Ethiopian",
    location: "Bole Medhanialem",
    neighborhood: "Bole",
    distance: "280m",
    rating: 9.6,
    reviewCount: 1240,
    priceRange: "$$",
    description: "An authentic Habesha cultural dining experience with traditional music, dance performances, and generous platters made for sharing.",
    shortDescription: "Authentic Habesha dining, cultural shows, and generous platters.",
    images: sharedImages,
    tags: ["Credit card accepted", "Live cultural show", "Fasting menu", "Family friendly"],
    paymentMethods: ["Cash", "Credit card", "Telebirr"],
    openingHours: "10:00 AM - 11:00 PM",
    phone: "+251 11 555 1234",
    verified: true,
    reservationAvailable: true,
    featured: true,
    isOpen: true,
    menu: [
      { category: "Traditional Dishes", items: [{ name: "Doro Wat", price: "250 ETB", description: "Tender chicken in a rich berbere sauce, served with injera." }, { name: "Kitfo", price: "280 ETB", description: "Finely minced beef seasoned with mitmita and niter kibbeh." }, { name: "Tibs", price: "400 ETB", description: "Sizzling beef cubes with onions, peppers, and rosemary." }] },
      { category: "Vegetarian", items: [{ name: "Shiro Wat", price: "120 ETB", description: "Creamy chickpea stew with garlic, onions, and berbere." }, { name: "Gomen", price: "130 ETB", description: "Tender collard greens with garlic, onions, and lemon." }] },
      { category: "Drinks", items: [{ name: "Tej", price: "80 ETB", description: "Traditional Ethiopian honey wine with a sweet, tangy flavor." }, { name: "Coffee Ceremony", price: "40 ETB", description: "Freshly roasted and brewed Ethiopian coffee." }] },
    ],
    updates: [{ type: "Event", title: "Live cultural show tonight", description: "Traditional music, dance, and a dinner menu from 7pm.", createdAt: "2h ago" }],
    reviews: [{ id: 1, user: "Abebe K.", rating: 5, date: "2 weeks ago", comment: "Amazing cultural experience! The food was delicious and the live music was fantastic." }, { id: 2, user: "Mearg T.", rating: 4, date: "1 month ago", comment: "Great food and atmosphere. The cultural show made up for the slow service." }],
  },
  {
    id: 2,
    name: "Kaffa Coffee Roastery & Bistro",
    category: "cafe",
    cuisine: "Coffee & Bakery",
    location: "Kazanchis",
    neighborhood: "Kazanchis",
    distance: "150m",
    rating: 9.5,
    reviewCount: 890,
    priceRange: "$$",
    description: "A specialty coffee roastery serving traceable Ethiopian beans, fresh pastries, and relaxed brunch plates in a bright, work-friendly space.",
    shortDescription: "Specialty buna, artisan pastries, and relaxed brunch.",
    images: ["/images/cafe/placeholder1.webp", ...sharedImages.slice(1)],
    tags: ["Single-origin beans", "Work-friendly", "Outdoor patio"],
    paymentMethods: ["Cash", "Telebirr", "Card"],
    openingHours: "7:00 AM - 9:00 PM",
    phone: "+251 91 222 4477",
    verified: true,
    reservationAvailable: true,
    featured: true,
    isOpen: true,
    menu: [{ category: "Coffee", items: [{ name: "Guji Pour-over", price: "180 ETB", description: "Bright, floral single-origin coffee brewed to order." }, { name: "Spiced Honey Latte", price: "160 ETB", description: "Espresso, steamed milk, local honey, and warm spice." }] }],
    updates: [{ type: "New menu", title: "New seasonal coffee menu", description: "Try the new Guji pour-over and spiced honey latte.", createdAt: "2h ago" }],
    reviews: [{ id: 3, user: "Hana M.", rating: 5, date: "1 week ago", comment: "Excellent coffee and a calm place to get some work done." }],
  },
  {
    id: 3,
    name: "The Wood Oven Trattoria",
    category: "restaurant",
    cuisine: "Italian",
    location: "Bole Atlas",
    neighborhood: "Bole Atlas",
    distance: "420m",
    rating: 9.4,
    reviewCount: 620,
    priceRange: "$$$",
    description: "A neighborhood trattoria for wood-fired pizzas, handmade pasta, and an easygoing evening wine service.",
    shortDescription: "Wood-fired pizza, handmade pasta, and a wine bar.",
    images: ["/images/placeholder3.jpeg", ...sharedImages.slice(0, 3)],
    tags: ["Cocktail lounge", "Reservations recommended", "Italian"],
    paymentMethods: ["Cash", "Card"],
    openingHours: "11:00 AM - 10:30 PM",
    phone: "+251 92 101 7788",
    verified: true,
    reservationAvailable: true,
    featured: false,
    isOpen: true,
    menu: [{ category: "From the oven", items: [{ name: "Margherita", price: "420 ETB", description: "Tomato, mozzarella, basil, and olive oil." }, { name: "Mushroom Tagliatelle", price: "480 ETB", description: "Hand-cut pasta with wild mushrooms and parmesan." }] }],
    updates: [],
    reviews: [{ id: 4, user: "Dawit A.", rating: 5, date: "3 weeks ago", comment: "The crust is excellent and the patio is lovely in the evening." }],
  },
  {
    id: 4,
    name: "Tana Fresh Fish & Dullet House",
    category: "restaurant",
    cuisine: "Ethiopian Seafood",
    location: "Old Airport",
    neighborhood: "Old Airport",
    distance: "310m",
    rating: 9.3,
    reviewCount: 512,
    priceRange: "$$",
    description: "Fresh Lake Tana tilapia, flavorful asa dulet, and Ethiopian sides served in a welcoming family dining room.",
    shortDescription: "Fresh tilapia, asa dulet, and Ethiopian family dining.",
    images: ["/images/placeholder4.jpeg", ...sharedImages.slice(0, 3)],
    tags: ["Daily fresh catch", "Fasting options", "Family friendly"],
    paymentMethods: ["Cash", "Telebirr"],
    openingHours: "11:30 AM - 10:00 PM",
    phone: "+251 93 345 6677",
    verified: false,
    reservationAvailable: false,
    claimStatus: "claimed",
    featured: false,
    isOpen: true,
    menu: [{ category: "Fresh from the lake", items: [{ name: "Grilled Tilapia", price: "520 ETB", description: "Whole tilapia with lemon, herbs, and seasonal sides." }, { name: "Asa Dulet", price: "360 ETB", description: "A bright, spicy fish dish with onion and local herbs." }] }],
    updates: [],
    reviews: [{ id: 5, user: "Selam T.", rating: 4, date: "1 month ago", comment: "Fresh fish and generous portions. A good choice for a family meal." }],
  },
  {
    id: 5,
    name: "Burger Haven",
    category: "restaurant",
    cuisine: "Burgers & Fast Food",
    location: "Bole",
    neighborhood: "Bole",
    distance: "500m",
    rating: 9.2,
    reviewCount: 480,
    priceRange: "$$",
    description: "Hand-pressed burgers, crisp fries, and thick shakes with a casual atmosphere made for a quick lunch or relaxed group meal.",
    shortDescription: "Hand-pressed burgers, crisp fries, and thick shakes.",
    images: ["/images/burgre.jpg", ...sharedImages.slice(0, 3)],
    tags: ["Family friendly", "Outdoor seating", "Lunch favorite"],
    paymentMethods: ["Cash", "Card", "Telebirr"],
    openingHours: "10:00 AM - 11:00 PM",
    phone: "+251 91 876 5432",
    verified: true,
    reservationAvailable: true,
    featured: false,
    isOpen: true,
    menu: [{ category: "Haven favorites", items: [{ name: "Addis Smash Burger", price: "390 ETB", description: "Two smashed beef patties, cheddar, pickles, and house sauce." }, { name: "Mango Shake", price: "170 ETB", description: "A creamy mango shake made with fresh fruit." }] }],
    updates: [{ type: "Offer", title: "20% off lunch combos this week", description: "A quick lunch with a burger, fries, and a soft drink.", createdAt: "Yesterday" }],
    reviews: [{ id: 6, user: "Mekdes G.", rating: 4, date: "2 weeks ago", comment: "The lunch combo is filling and the service is quick." }],
  },
  {
    id: 6,
    name: "Saro's Juice & Mocktail Bar",
    category: "drinks",
    cuisine: "Juices & Mocktails",
    location: "Bole Atlas",
    neighborhood: "Bole Atlas",
    distance: "240m",
    rating: 9.1,
    reviewCount: 304,
    priceRange: "$",
    description: "Fresh-pressed juices, colorful mocktails, and light bites made with seasonal produce in a lively Bole spot.",
    shortDescription: "Fresh juices, mocktails, and light seasonal bites.",
    images: ["/images/pizza.jpg", ...sharedImages.slice(0, 3)],
    tags: ["Fresh pressed", "Non-alcoholic", "Takeaway"],
    paymentMethods: ["Cash", "Telebirr"],
    openingHours: "8:00 AM - 10:00 PM",
    phone: "+251 94 221 3090",
    verified: false,
    reservationAvailable: false,
    featured: false,
    isOpen: true,
    menu: [{ category: "Drinks", items: [{ name: "Passion Fruit Cooler", price: "140 ETB", description: "Passion fruit, lime, mint, and sparkling water." }, { name: "Green Press", price: "180 ETB", description: "Apple, cucumber, ginger, and fresh lime." }] }],
    updates: [],
    reviews: [{ id: 7, user: "Rahel B.", rating: 5, date: "4 days ago", comment: "Fresh, fast, and exactly what I wanted on a hot afternoon." }],
  },
  {
    id: 7,
    name: "Kategna Traditional Coffee House",
    category: "cafe",
    cuisine: "Coffee & Ethiopian Snacks",
    location: "Megenagna",
    neighborhood: "Megenagna",
    distance: "650m",
    rating: 9.0,
    reviewCount: 278,
    priceRange: "$",
    description: "A warm neighborhood coffee house for buna ceremony, traditional snacks, and a quiet afternoon break.",
    shortDescription: "Traditional buna ceremony and Ethiopian snacks.",
    images: ["/images/cafe/placeholder2.webp", ...sharedImages.slice(0, 3)],
    tags: ["Coffee ceremony", "Quiet corner", "Local favorite"],
    paymentMethods: ["Cash", "Telebirr"],
    openingHours: "6:30 AM - 8:30 PM",
    phone: "+251 98 110 2244",
    verified: false,
    reservationAvailable: false,
    featured: false,
    isOpen: true,
    menu: [{ category: "Coffee house", items: [{ name: "Buna Ceremony", price: "120 ETB", description: "Freshly roasted coffee prepared in the traditional way." }, { name: "Chechebsa", price: "160 ETB", description: "Torn flatbread with spiced butter and honey." }] }],
    updates: [],
    reviews: [{ id: 8, user: "Yonas H.", rating: 4, date: "2 months ago", comment: "A lovely, unhurried place for traditional coffee." }],
  },
  {
    id: 8,
    name: "Zula Rooftop Lounge",
    category: "drinks",
    cuisine: "Cocktails & Small Plates",
    location: "Kazanchis",
    neighborhood: "Kazanchis",
    distance: "400m",
    rating: 8.9,
    reviewCount: 196,
    priceRange: "$$$",
    description: "A relaxed rooftop for signature cocktails, Ethiopian-inspired small plates, and evening views over the city.",
    shortDescription: "Signature cocktails, small plates, and city views.",
    images: ["/images/placeholder2.jpeg", ...sharedImages.slice(0, 3)],
    tags: ["Rooftop", "Live DJ", "Reservations recommended"],
    paymentMethods: ["Cash", "Card"],
    openingHours: "4:00 PM - 1:00 AM",
    phone: "+251 90 555 1840",
    verified: true,
    reservationAvailable: false,
    featured: false,
    isOpen: true,
    menu: [{ category: "Drinks", items: [{ name: "Tamarind Sour", price: "320 ETB", description: "Tamarind, citrus, and a bright botanical spirit." }, { name: "Ginger Mule", price: "300 ETB", description: "Fresh ginger, lime, and sparkling soda." }] }],
    updates: [],
    reviews: [{ id: 9, user: "Liya S.", rating: 5, date: "3 weeks ago", comment: "The view and the music make this a great evening spot." }],
  },
];

export function getBusinessById(id: string | number) {
  return mockBusinesses.find((business) => business.id === Number(id));
}

export function getBusinessesByCategory(category?: BusinessCategory) {
  return category ? mockBusinesses.filter((business) => business.category === category) : mockBusinesses;
}

export function toBusinessCardItem(business: MockBusiness) {
  const reviewSummary = getReviewSummary(business.id);
  return {
    id: business.id,
    name: business.name,
    image: business.images[0],
    location: `${business.location}, ${business.distance}`,
    description: business.shortDescription,
    rating: reviewSummary.average,
    reviews: reviewSummary.count,
    tags: business.tags,
  };
}
