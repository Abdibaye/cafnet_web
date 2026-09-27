import BusinessImageGallery from "@/components/BusinessImageGallery";

const business = {
  name: "Yod Abyssinia Cultural Restaurant",
  rating: 9.6,
  reviews: 1240,
  averagePrice: "ETB",
  address: "Bole Medhanialem, Addis Ababa, Ethiopia",
  nearestPlace: "Bole Medhanialem, 280m from Addis Ababa Stadium",
  phone: "+251 11 555 1234",
  hours: "10:00 AM - 11:00 PM",
  description: "Authentic Habesha cultural dining experience with live traditional music and dance performances. Specializing in traditional Ethiopian cuisine with a modern twist.",
  images: ["/images/placeholder1.jpeg", "/images/placeholder2.jpeg", "/images/placeholder3.jpeg", "/images/placeholder4.jpeg", "/images/placeholder1.jpeg", "/images/placeholder2.jpeg"],
  tags: ["Credit card accepted", "Wi-Fi available", "Live cultural show", "Fasting menu", "Parking available", "Family friendly"],
  menu: [
    { category: "Traditional Dishes", items: [
      { name: "Doro Wat", price: "250 ETB", description: "Tender chicken in a rich berbere sauce, served with injera." },
      { name: "Tibs Firfir", price: "320 ETB", description: "Minced beef and shredded injera simmered in a spicy sauce." },
      { name: "Kitfo", price: "280 ETB", description: "Finely minced beef seasoned with mitmita and niter kibbeh." },
      { name: "Tere Siga", price: "350 ETB", description: "Premium raw beef seasoned with traditional Ethiopian spices." },
      { name: "Gored Gored", price: "380 ETB", description: "Cubed raw beef marinated in spiced clarified butter." },
      { name: "Tibs", price: "400 ETB", description: "Sizzling beef cubes with onions, peppers, and rosemary." },
    ] },
    { category: "Vegetarian", items: [
      { name: "Shiro Wat", price: "120 ETB", description: "Creamy chickpea stew with garlic, onions, and berbere." },
      { name: "Atakilt Wat", price: "140 ETB", description: "Cabbage, carrots, and potatoes in turmeric-infused sauce." },
      { name: "Gomen", price: "130 ETB", description: "Tender collard greens with garlic, onions, and lemon." },
      { name: "Kik Alicha", price: "150 ETB", description: "Mild split pea stew cooked with turmeric, garlic, and onions." },
    ] },
    { category: "Drinks", items: [
      { name: "Tej", price: "80 ETB", description: "Traditional Ethiopian honey wine with a sweet, tangy flavor." },
      { name: "Tella", price: "60 ETB", description: "Homemade traditional beer brewed from barley or maize." },
      { name: "Coffee", price: "40 ETB", description: "Freshly roasted and brewed Ethiopian coffee ceremony." },
      { name: "Soft Drinks", price: "30 ETB", description: "A selection of local and international soft drinks." },
    ] },
  ],
  reviewList: [
    { id: 1, user: "Abebe K.", rating: 5, date: "2 weeks ago", comment: "Amazing cultural experience! The food was delicious and the live music was fantastic." },
    { id: 2, user: "Mearg T.", rating: 4, date: "1 month ago", comment: "Great food and atmosphere. The cultural show made up for the slow service." },
    { id: 3, user: "Sara W.", rating: 5, date: "3 weeks ago", comment: "Best traditional Ethiopian food I've had in Addis. Loved the live music!" },
    { id: 4, user: "Dawit A.", rating: 4, date: "2 months ago", comment: "Excellent place for group dining with an impressive variety of dishes." },
  ],
};

function Rating({ showReviews = false }: { showReviews?: boolean }) {
  return <span className="inline-flex items-center gap-1.5 font-semibold text-secondary"><span aria-hidden="true">★</span>{business.rating.toFixed(1)}{showReviews && <span className="font-normal text-on-surface-variant">· {business.reviews.toLocaleString()} reviews</span>}</span>;
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return <div className="mb-5">{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{eyebrow}</p>}<h2 className="text-[22px] font-bold text-on-surface md:text-2xl">{title}</h2></div>;
}

export default function BusinessProfile() {
  const amenities = business.tags.filter((tag) => ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag));
  const highlightTags = business.tags.filter((tag) => ["Live cultural show", "Fasting menu", "Family friendly"].includes(tag));

  return <div className="w-full bg-background"><div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-12 lg:pt-12">
    <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><h1 className="max-w-3xl text-[28px] font-bold leading-tight text-on-surface md:text-[32px]">{business.name}</h1><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><Rating showReviews /><span className="text-on-surface-variant">{business.averagePrice}</span><span className="text-on-surface-variant">Traditional · Cultural</span></div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface-variant"><span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">location_on</span><strong className="text-on-surface">{business.nearestPlace.split(",")[0]}</strong></span><span>{business.nearestPlace.split(",").slice(1).join(",").trim()}</span></div></div><div className="flex flex-wrap gap-2"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0f46b8]"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">directions</span>Get directions</a><a href={`tel:${business.phone.replaceAll(" ", "")}`} className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">call</span>Call</a></div></header>

    <BusinessImageGallery images={business.images} businessName={business.name} />
    <nav className="sticky top-20 z-10 -mx-5 mb-10 overflow-x-auto border-b border-outline-variant bg-background/95 px-5 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12" aria-label="Business profile sections"><div className="flex min-w-max gap-7">{[["overview", "Overview"], ["menu", "Menu"], ["photos", "Photos"], ["reviews", "Reviews"]].map(([id, label], index) => <a key={id} href={`#${id}`} className={`border-b-2 py-4 text-sm font-semibold ${index === 0 ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{label}</a>)}</div></nav>

    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16"><main className="min-w-0">
      <section id="overview" className="scroll-mt-36 border-b border-outline-variant pb-10"><SectionHeading eyebrow="The place" title="About" /><p className="max-w-3xl text-[15px] leading-7 text-on-surface-variant">{business.description}</p><div className="mt-8"><h3 className="mb-3 text-base font-bold text-on-surface">Highlights</h3><div className="grid gap-3 sm:grid-cols-2">{highlightTags.map((tag) => <div key={tag} className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">check_circle</span>{tag}</div>)}</div></div></section>
      <section id="menu" className="scroll-mt-36 border-b border-outline-variant py-10"><SectionHeading eyebrow="What you can eat" title="Popular dishes" /><div className="space-y-8">{business.menu.map((category, categoryIndex) => <div key={category.category}><h3 className="mb-3 text-base font-bold text-on-surface">{category.category}</h3><div className="grid gap-3 md:grid-cols-2">{category.items.map((item, itemIndex) => <article key={item.name} className="flex gap-3 rounded-[14px] border border-outline-variant/80 bg-white p-3"><img src={business.images[(categoryIndex * 2 + itemIndex) % business.images.length]} alt="" className="size-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0 py-0.5"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold text-on-surface">{item.name}</h4><span className="shrink-0 text-sm font-semibold text-primary">{item.price}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{item.description}</p></div></article>)}</div></div>)}</div></section>
      <section id="updates" className="border-b border-outline-variant py-10"><SectionHeading eyebrow="From the business" title="What's new" /><div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">No business updates yet.</div></section>
      <section id="reviews" className="scroll-mt-36 pt-10"><SectionHeading eyebrow="What people think" title="Reviews" /><div className="mb-8 flex items-center gap-4 border-b border-outline-variant pb-7"><div className="text-4xl font-bold text-on-surface">{business.rating.toFixed(1)}<span className="text-xl text-on-surface-variant"> / 10</span></div><div><Rating /><p className="mt-1 text-sm text-on-surface-variant">{business.reviews.toLocaleString()} reviews</p></div></div><div className="divide-y divide-outline-variant">{business.reviewList.map((review) => <article key={review.id} className="py-6 first:pt-0"><div className="flex items-start justify-between gap-4"><div><h3 className="text-sm font-semibold text-on-surface">{review.user}</h3><span className="mt-1 inline-block text-sm tracking-[0.12em] text-secondary" aria-label={`${review.rating} out of 5 stars`}>★ {review.rating}/5</span></div><time className="shrink-0 text-xs text-on-surface-variant">{review.date}</time></div><p className="mt-3 text-sm leading-6 text-on-surface-variant">{review.comment}</p></article>)}</div></section>
    </main><aside className="h-fit lg:sticky lg:top-36"><section className="rounded-[14px] border border-outline-variant bg-white p-5" aria-labelledby="good-to-know-heading"><h2 id="good-to-know-heading" className="text-lg font-bold text-on-surface">Good to know</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><Info icon="location_on" label="Location" value={business.address} /><Info icon="schedule" label="Hours" value={business.hours} /><Info icon="call" label="Phone" value={business.phone} />{amenities.map((tag) => <Info key={tag} icon={tag.includes("Wi-Fi") ? "wifi" : tag.includes("Parking") ? "local_parking" : tag.includes("Credit") ? "credit_card" : "family_restroom"} label={tag.replace(" available", "")} value={tag.includes("available") ? "Available" : "Yes"} />)}</div></section></aside></div>
  </div></div>;
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex gap-3"><span className="material-symbols-outlined text-[19px] text-secondary" aria-hidden="true">{icon}</span><div className="min-w-0"><p className="text-xs text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-on-surface">{value}</p></div></div>;
}
