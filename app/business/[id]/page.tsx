import type { Metadata } from "next";
import Link from "next/link";
import BusinessImageGallery from "@/components/BusinessImageGallery";
import BusinessProfileActions from "@/components/BusinessProfileActions";
import BusinessReviewSection, { BusinessRatingSummary } from "@/components/BusinessReviewSection";
import BusinessProfileUpdatesSection from "@/components/BusinessProfileUpdatesSection";
import BusinessProfileMenuSection from "@/components/BusinessProfileMenuSection";
import { getBusinessById } from "@/data/mockBusinesses";
import { getBusinessProfileData } from "@/data/businessProfileData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = getBusinessById(id);

  if (!business) {
    return {
      title: "Business Not Found | Cafnet",
      description: "This place may have been removed or the link may be incorrect.",
    };
  }

  const title = `${business.name} - ${business.neighborhood || business.location} | Cafnet`;
  const description =
    business.shortDescription ||
    business.description ||
    `Explore ${business.name} in Addis Ababa on Cafnet. View menu, reviews, photos, and updates.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: business.images && business.images.length > 0 ? [business.images[0]] : [],
    },
  };
}

function SectionHeading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-5">
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          {eyebrow}
        </p>
      )}
      <h2 className="text-[22px] font-bold text-on-surface md:text-2xl">{title}</h2>
    </div>
  );
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="material-symbols-outlined text-[19px] text-secondary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-on-surface-variant">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function MissingBusiness() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 py-24 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
        <span className="material-symbols-outlined text-4xl" aria-hidden="true">
          location_off
        </span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Place not found
      </p>
      <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
        Business not found
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
        This place may have been removed or the link may be incorrect.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/explore"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8]"
        >
          Explore places
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            arrow_forward
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-6 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            home
          </span>
          Go home
        </Link>
      </div>
    </div>
  );
}

export default async function BusinessProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profileData = getBusinessProfileData(id);

  if (!profileData) return <MissingBusiness />;

  const address = `${profileData.location}, Addis Ababa, Ethiopia`;
  const amenities = profileData.tags.filter((tag) =>
    ["Credit card accepted", "Wi-Fi available", "Parking available", "Family friendly"].includes(tag)
  );
  const highlights = profileData.tags.filter((tag) => !amenities.includes(tag)).slice(0, 3);

  const formattedOpeningHours =
    typeof profileData.openingHours === "string"
      ? profileData.openingHours || "Hours not available"
      : Array.isArray(profileData.openingHours)
        ? profileData.openingHours
            .filter((h) => !h.isClosed)
            .map((h) => `${h.day}: ${h.open} – ${h.close}`)
            .join(", ") || "Closed"
        : "Hours not available";

  return (
    <div className="w-full bg-background">
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-6 lg:px-12 lg:pt-12">
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="max-w-3xl text-[28px] font-bold leading-tight text-on-surface md:text-[32px]">
                {profileData.name}
              </h1>
              {profileData.verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary" aria-hidden="true">
                    verified
                  </span>
                  Verified business
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a
                href="#reviews"
                className="rounded-sm focus-visible:outline-2 focus-visible:outline-primary"
              >
                <BusinessRatingSummary businessId={profileData.id} />
              </a>
              <span className="text-on-surface-variant">{profileData.priceRange}</span>
              <span className="text-on-surface-variant">{profileData.cuisine}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                  location_on
                </span>
                <strong className="text-on-surface">{profileData.location}</strong>
              </span>
              <span>{profileData.distance} around Bole</span>
              <span className={profileData.isOpen ? "font-semibold text-primary" : "font-semibold text-secondary"}>
                ● {profileData.isOpen ? "Open now" : "Closed"}
              </span>
            </div>
          </div>
          <BusinessProfileActions
            businessId={profileData.id}
            businessName={profileData.name}
            address={address}
            phone={profileData.phone}
            hasUpdates={profileData.updates.length > 0}
            reservationAvailable={profileData.reservationAvailable}
          />
        </header>

        <BusinessImageGallery images={profileData.images} businessName={profileData.name} />

        <nav
          className="sticky top-16 md:top-20 z-10 -mx-5 mb-10 overflow-x-auto border-b border-outline-variant bg-background/95 px-5 sm:-mx-6 sm:px-6 lg:-mx-12 lg:px-12"
          aria-label="Business profile sections"
        >
          <div className="flex min-w-max gap-7">
            {[
              ["overview", "Overview"],
              ["menu", "Menu"],
              ["photos", "Photos"],
              ["updates", "Updates"],
              ["reviews", "Reviews"],
            ].map(([tabId, label], index) => (
              <a
                key={tabId}
                href={`#${tabId}`}
                className={`border-b-2 py-4 text-sm font-semibold transition-colors ${
                  index === 0
                    ? "border-primary text-primary"
                    : "border-transparent text-on-surface-variant hover:text-primary"
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <main className="min-w-0">
            <section id="overview" className="scroll-mt-36 border-b border-outline-variant pb-10">
              <SectionHeading eyebrow="The place" title="About" />
              <p className="max-w-3xl text-[15px] leading-7 text-on-surface-variant">
                {profileData.description}
              </p>
              <div className="mt-8">
                <h3 className="mb-3 text-base font-bold text-on-surface">Highlights</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {highlights.map((tag) => (
                    <div key={tag} className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                        check_circle
                      </span>
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="menu" className="scroll-mt-36 border-b border-outline-variant py-10">
              <SectionHeading eyebrow="What you can eat" title="Popular dishes" />
              <BusinessProfileMenuSection businessId={profileData.id} images={profileData.images} />
            </section>

            <section id="updates" className="scroll-mt-36 border-b border-outline-variant py-10">
              <SectionHeading eyebrow="From the business" title="What's new" />
              <BusinessProfileUpdatesSection business={profileData} />
            </section>

            <section id="reviews" className="scroll-mt-36 pt-10">
              <SectionHeading eyebrow="What people think" title="Reviews" />
              <BusinessReviewSection business={profileData} />
            </section>
          </main>

          <aside className="h-fit lg:sticky lg:top-36">
            <section
              className="rounded-[14px] border border-outline-variant bg-white p-5"
              aria-labelledby="good-to-know-heading"
            >
              <h2 id="good-to-know-heading" className="text-lg font-bold text-on-surface">
                Good to know
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <Info icon="location_on" label="Location" value={address} />
                <Info icon="schedule" label="Hours" value={formattedOpeningHours} />
                <Info icon="call" label="Phone" value={profileData.phone} />
                {amenities.map((tag) => (
                  <Info
                    key={tag}
                    icon={
                      tag.includes("Wi-Fi")
                        ? "wifi"
                        : tag.includes("Parking")
                        ? "local_parking"
                        : tag.includes("Credit")
                        ? "credit_card"
                        : "family_restroom"
                    }
                    label={tag.replace(" available", "")}
                    value={tag.includes("available") ? "Available" : "Yes"}
                  />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
