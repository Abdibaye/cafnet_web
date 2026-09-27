import Link from "next/link";
import BusinessImageGallery from "@/components/BusinessImageGallery";
import BusinessProfileActions from "@/components/BusinessProfileActions";
import BusinessReviews from "@/components/BusinessReviews";
import { getBusinessById } from "@/data/mockBusinesses";
import { getBusinessReviews, getReviewSummary } from "@/data/mockReviews";

function Rating({ average, count, showReviews = false }: { average: number; count: number; showReviews?: boolean }) {
  if (count === 0) return <span className="font-semibold text-primary">New on Cafnet</span>;
  return <span className="inline-flex items-center gap-1.5 font-semibold text-secondary"><span aria-label={`${average.toFixed(1)} out of 5 stars`}>★★★★★</span><span>{average.toFixed(1)}</span>{showReviews && <span className="font-normal text-on-surface-variant">· {count.toLocaleString()} reviews</span>}</span>;
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return <div className="mb-5">{eyebrow && <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">{eyebrow}</p>}<h2 className="text-[22px] font-bold text-on-surface md:text-2xl">{title}</h2></div>;
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <div className="flex gap-3"><span className="material-symbols-outlined text-[19px] text-secondary" aria-hidden="true">{icon}</span><div className="min-w-0"><p className="text-xs text-on-surface-variant">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-on-surface">{value}</p></div></div>;
}

function MissingBusiness() {
  return <div className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="text-2xl font-bold text-on-surface">Business not found</h1><p className="mt-3 text-sm text-on-surface-variant">This place may have been removed or the link may be incorrect.</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary" href="/explore">Explore places <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span></Link></div>;
}

export default async function BusinessProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = getBusinessById(id);

  if (!business) return <MissingBusiness />;

  const address = `${business.location}, Addis Ababa, Ethiopia`;
  const amenities = business.tags.filter((tag) => ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag));
  const highlights = business.tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);
  const reviewSummary = getReviewSummary(business.id);
  const reviews = getBusinessReviews(business.id);

  return <div className="w-full bg-background"><div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-12 lg:pt-12">
    <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="max-w-3xl text-[28px] font-bold leading-tight text-on-surface md:text-[32px]">{business.name}</h1>{business.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant"><span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">verified</span>Verified business</span>}</div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"><a href="#reviews" className="rounded-sm focus-visible:outline-2 focus-visible:outline-primary"><Rating average={reviewSummary.average} count={reviewSummary.count} showReviews /></a><span className="text-on-surface-variant">{business.priceRange}</span><span className="text-on-surface-variant">{business.cuisine}</span></div><div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface-variant"><span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">location_on</span><strong className="text-on-surface">{business.location}</strong></span><span>{business.distance} around Bole</span><span className={business.isOpen ? "font-semibold text-primary" : "font-semibold text-secondary"}>● {business.isOpen ? "Open now" : "Closed"}</span></div></div><BusinessProfileActions businessId={business.id} businessName={business.name} address={address} phone={business.phone} hasUpdates={business.updates.length > 0} reservationAvailable={business.reservationAvailable} /></header>

    <BusinessImageGallery images={business.images} businessName={business.name} />
    <nav className="sticky top-20 z-10 -mx-5 mb-10 overflow-x-auto border-b border-outline-variant bg-background/95 px-5 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12" aria-label="Business profile sections"><div className="flex min-w-max gap-7">{[["overview", "Overview"], ["menu", "Menu"], ["photos", "Photos"], ["reviews", "Reviews"]].map(([id, label], index) => <a key={id} href={`#${id}`} className={`border-b-2 py-4 text-sm font-semibold ${index === 0 ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-primary"}`}>{label}</a>)}</div></nav>

    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16"><main className="min-w-0">
      <section id="overview" className="scroll-mt-36 border-b border-outline-variant pb-10"><SectionHeading eyebrow="The place" title="About" /><p className="max-w-3xl text-[15px] leading-7 text-on-surface-variant">{business.description}</p><div className="mt-8"><h3 className="mb-3 text-base font-bold text-on-surface">Highlights</h3><div className="grid gap-3 sm:grid-cols-2">{highlights.map((tag) => <div key={tag} className="flex items-center gap-2 text-sm text-on-surface-variant"><span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">check_circle</span>{tag}</div>)}</div></div></section>
      <section id="menu" className="scroll-mt-36 border-b border-outline-variant py-10"><SectionHeading eyebrow="What you can eat" title="Popular dishes" />{business.menu.length > 0 ? <div className="space-y-8">{business.menu.map((category, categoryIndex) => <div key={category.category}><h3 className="mb-3 text-base font-bold text-on-surface">{category.category}</h3><div className="grid gap-3 md:grid-cols-2">{category.items.map((item, itemIndex) => <article key={item.name} className="flex gap-3 rounded-[14px] border border-outline-variant/80 bg-white p-3"><img src={business.images[(categoryIndex * 2 + itemIndex) % business.images.length]} alt="" className="size-20 shrink-0 rounded-xl object-cover" /><div className="min-w-0 py-0.5"><div className="flex items-start justify-between gap-2"><h4 className="text-sm font-semibold text-on-surface">{item.name}</h4><span className="shrink-0 text-sm font-semibold text-primary">{item.price}</span></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-on-surface-variant">{item.description}</p></div></article>)}</div></div>)}</div> : <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">Menu details are not available yet.</div>}</section>
      <section id="updates" className="border-b border-outline-variant py-10"><SectionHeading eyebrow="From the business" title="What's new" />{business.updates.length > 0 ? <div className="space-y-3">{business.updates.map((update) => <article key={update.title} className="border border-outline-variant bg-white p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">{update.type}</span><time className="text-xs text-on-surface-variant">{update.createdAt}</time></div><h3 className="mt-3 font-semibold text-on-surface">{update.title}</h3><p className="mt-1 text-sm leading-6 text-on-surface-variant">{update.description}</p></article>)}</div> : <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-6 text-sm text-on-surface-variant">No business updates yet.</div>}</section>
      <section id="reviews" className="scroll-mt-36 pt-10"><SectionHeading eyebrow="What people think" title="Reviews" /><BusinessReviews reviews={reviews} average={reviewSummary.average} distribution={reviewSummary.distribution} /></section>
    </main><aside className="h-fit lg:sticky lg:top-36"><section className="rounded-[14px] border border-outline-variant bg-white p-5" aria-labelledby="good-to-know-heading"><h2 id="good-to-know-heading" className="text-lg font-bold text-on-surface">Good to know</h2><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1"><Info icon="location_on" label="Location" value={address} /><Info icon="schedule" label="Hours" value={business.openingHours} /><Info icon="call" label="Phone" value={business.phone} />{amenities.map((tag) => <Info key={tag} icon={tag.includes("Wi-Fi") ? "wifi" : tag.includes("Parking") ? "local_parking" : tag.includes("Credit") ? "credit_card" : "family_restroom"} label={tag.replace(" available", "")} value={tag.includes("available") ? "Available" : "Yes"} />)}</div></section></aside></div>
  </div></div>;
}
