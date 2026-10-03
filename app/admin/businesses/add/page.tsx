"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api/admin";
import ImageUpload from "@/components/ImageUpload";
import { useCustomer } from "@/components/CustomerProvider";
import type { BusinessCategory, PriceRange, PublicationStatus, Media } from "@/lib/api/types";

const CATEGORIES: { value: BusinessCategory; label: string }[] = [
  { value: "cafe", label: "Café" },
  { value: "restaurant", label: "Restaurant" },
  { value: "drinks", label: "Drinks & Nightlife" },
];

const PRICE_RANGES: { value: PriceRange; label: string }[] = [
  { value: "$", label: "$ (Budget-friendly)" },
  { value: "$$", label: "$$ (Moderate)" },
  { value: "$$$", label: "$$$ (Upscale)" },
  { value: "$$$$", label: "$$$$ (Fine dining)" },
];

const POPULAR_NEIGHBORHOODS = [
  "Bole",
  "Kazanchis",
  "Piazza",
  "Old Airport",
  "Sarbet",
  "CMC",
  "Meskel Flower",
  "Gerji",
  "Megenagna",
  "Summit",
  "Mexico",
  "Gotera",
];

export default function AdminAddBusinessPage() {
  const router = useRouter();
  const { showToast } = useCustomer();

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory>("cafe");
  const [neighborhood, setNeighborhood] = useState("");
  const [locationName, setLocationName] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange>("$$");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [publicationStatus, setPublicationStatus] = useState<PublicationStatus>("PUBLISHED");

  // Media
  const [coverMedia, setCoverMedia] = useState<Media | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedNeighborhood = neighborhood.trim();

    if (!trimmedName) {
      setError("Business name is required.");
      return;
    }

    if (!trimmedNeighborhood) {
      setError("Neighborhood / area is required.");
      return;
    }

    try {
      setSubmitting(true);
      const created = await adminApi.createBusiness({
        name: trimmedName,
        category,
        neighborhood: trimmedNeighborhood,
        location_name: locationName.trim() || undefined,
        address_line: addressLine.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        price_range: priceRange,
        short_description: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        publication_status: publicationStatus,
        cover_media_id: coverMedia?.id,
      });

      showToast(`Business "${created.name}" created successfully.`);
      router.push(`/admin/businesses/${created.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create business";
      setError(msg);
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header & Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
          <Link href="/admin/businesses" className="hover:text-primary transition-colors">
            Businesses
          </Link>
          <span>/</span>
          <span className="text-on-surface">Add Business</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-on-surface">Add Business</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Create an unclaimed business listing curated directly by Cafnet administration. The listing
          will be immediately discoverable and open for legitimate owner claims.
        </p>
      </div>

      {/* Invariants & Ownership Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-blue-950">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined mt-0.5 text-blue-600">info</span>
          <div className="space-y-1 text-xs">
            <p className="font-bold text-sm text-blue-900">Admin-Created Listing Invariants</p>
            <p>
              • <strong>Ownership:</strong> Unclaimed (no manager record created for admin).
            </p>
            <p>
              • <strong>Claimable:</strong> Yes. Prospective owners will see a verified claim CTA on the profile.
            </p>
            <p>
              • <strong>Creation Source:</strong> Recorded as <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">ADMIN_CREATED</code> with an immutable audit entry.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Section 1: Business Basics */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-on-surface">1. Business Basics</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="sm:col-span-2">
              <label htmlFor="name" className="block text-xs font-bold text-on-surface">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="e.g. Tomoca Coffee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-on-surface">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as BusinessCategory)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-white px-3.5 text-sm font-medium outline-none transition-colors focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label htmlFor="priceRange" className="block text-xs font-bold text-on-surface">
                Price Range
              </label>
              <select
                id="priceRange"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as PriceRange)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-white px-3.5 text-sm font-medium outline-none transition-colors focus:border-primary"
              >
                {PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Neighborhood */}
            <div>
              <label htmlFor="neighborhood" className="block text-xs font-bold text-on-surface">
                Neighborhood / Area <span className="text-red-500">*</span>
              </label>
              <input
                id="neighborhood"
                type="text"
                required
                list="neighborhood-list"
                placeholder="e.g. Bole"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
              <datalist id="neighborhood-list">
                {POPULAR_NEIGHBORHOODS.map((nh) => (
                  <option key={nh} value={nh} />
                ))}
              </datalist>
            </div>

            {/* Specific Location Name / Landmark */}
            <div>
              <label htmlFor="locationName" className="block text-xs font-bold text-on-surface">
                Location Name / Landmark
              </label>
              <input
                id="locationName"
                type="text"
                placeholder="e.g. Medhanialem, Atlas"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Street Address */}
            <div className="sm:col-span-2">
              <label htmlFor="addressLine" className="block text-xs font-bold text-on-surface">
                Street Address
              </label>
              <input
                id="addressLine"
                type="text"
                placeholder="e.g. Cameroon St, House #142"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Contact Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-on-surface">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+251 91 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="website" className="block text-xs font-bold text-on-surface">
                Website URL
              </label>
              <input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Narrative & Description */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">2. Details & Descriptions</h2>

          <div>
            <label htmlFor="shortDescription" className="block text-xs font-bold text-on-surface">
              Short Description / Tagline
            </label>
            <input
              id="shortDescription"
              type="text"
              placeholder="e.g. Historic coffee house known for authentic espresso and traditional macchiato"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-outline-variant bg-transparent px-3.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-on-surface">
              Full Description
            </label>
            <textarea
              id="description"
              rows={4}
              placeholder="Describe the venue's atmosphere, signature offerings, seating, and unique ambiance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-outline-variant bg-transparent p-3.5 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
        </section>

        {/* Section 3: Media Upload */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">3. Cover Photo</h2>
          <p className="text-xs text-on-surface-variant">
            Upload a representative hero image for the venue. This image appears on search cards and at
            the top of the public profile.
          </p>

          <ImageUpload
            targetType="business_cover"
            label="Cover image"
            description="PNG, JPG, or WebP up to 10MB"
            aspectRatio="video"
            initialImageUrl={coverMedia?.url}
            onUploadComplete={(media) => {
              setCoverMedia(media);
              setError(null);
            }}
            onRemove={() => setCoverMedia(null)}
          />
        </section>

        {/* Section 4: Publication Status */}
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-on-surface">4. Publication Status</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                publicationStatus === "PUBLISHED"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <input
                type="radio"
                name="pubStatus"
                value="PUBLISHED"
                checked={publicationStatus === "PUBLISHED"}
                onChange={() => setPublicationStatus("PUBLISHED")}
                className="mt-1 size-4 accent-primary"
              />
              <div>
                <p className="text-sm font-bold">Publish Immediately</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Listing is publicly indexed, discoverable via search, and claimable by the owner.
                </p>
              </div>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                publicationStatus === "UNPUBLISHED"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <input
                type="radio"
                name="pubStatus"
                value="UNPUBLISHED"
                checked={publicationStatus === "UNPUBLISHED"}
                onChange={() => setPublicationStatus("UNPUBLISHED")}
                className="mt-1 size-4 accent-primary"
              />
              <div>
                <p className="text-sm font-bold">Save as Draft (Unpublished)</p>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Hidden from public discovery. Accessible only within the Admin Center.
                </p>
              </div>
            </label>
          </div>
        </section>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/admin/businesses"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-outline-variant bg-white px-5 text-xs font-bold text-on-surface transition-colors hover:bg-surface-container"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0f46b8] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">add_business</span>
                {publicationStatus === "PUBLISHED" ? "Create & Publish" : "Save as Draft"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
