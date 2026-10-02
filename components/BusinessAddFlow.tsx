"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import ImageUpload from "@/components/ImageUpload";
import type { Media } from "@/lib/api/types";
import type { BusinessSubmission } from "@/data/businessOwnerStorage";

const categories: { value: BusinessSubmission["category"]; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "drinks", label: "Drinks & More" },
];

export default function BusinessAddFlow() {
  const { authReady, isAuthenticated, startSignIn, startSignUp } = useCustomer();
  const { ready, submissions, submitBusiness } = useBusinessOwner();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<BusinessSubmission["category"]>("restaurant");
  const [area, setArea] = useState("");
  const [coverMedia, setCoverMedia] = useState<Media | null>(null);
  const [step, setStep] = useState<"form" | "preview" | "submitted">("form");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!authReady || !ready) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-on-surface-variant">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          For businesses
        </p>
        <h1 className="mt-2 text-2xl font-bold text-on-surface sm:text-3xl">
          Sign in to add your business
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">
          You must have a verified Cafnet account to submit a restaurant or cafe listing for review.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
            onClick={startSignIn}
          >
            Sign in
          </button>
          <button
            type="button"
            className="h-11 rounded-xl border border-outline-variant bg-white px-6 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
            onClick={startSignUp}
          >
            Create account
          </button>
        </div>
      </div>
    );
  }

  const pendingSubmission = submissions.find((s) => s.status === "pending");

  if (step === "form" && pendingSubmission) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
        <Link href="/business" className="text-sm font-semibold text-primary">
          ← For businesses
        </Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          New listing
        </p>
        <h1 className="mt-3 text-3xl font-bold text-on-surface">Business submission pending</h1>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          Your request to add <strong className="text-on-surface">{pendingSubmission.businessName}</strong> in{" "}
          <strong className="text-on-surface">{pendingSubmission.area}</strong> is currently being reviewed by platform administrators.
        </p>
        <div className="mt-8 border border-outline-variant bg-white p-5">
          <p className="font-semibold text-on-surface">Pending review</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            The listing will become public and appear in Business Center once an administrator approves it.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/business/dashboard"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          >
            Go to Business Center
          </Link>
          <Link
            href="/explore"
            className="inline-flex h-11 items-center rounded-xl border border-outline-variant bg-white px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
          >
            Back to Cafnet
          </Link>
        </div>
      </div>
    );
  }

  const continueToPreview = () => {
    const nameTrimmed = businessName.trim();
    const areaTrimmed = area.trim();

    if (!nameTrimmed || nameTrimmed.length < 2) {
      setError("Please enter a valid business name (at least 2 characters).");
      return;
    }
    if (!areaTrimmed || areaTrimmed.length < 2) {
      setError("Please specify the neighborhood or area (e.g. Bole, Kazanchis).");
      return;
    }
    if (!category) {
      setError("Please select a business category.");
      return;
    }
    if (!coverMedia) {
      setError("Please upload 1 cover photo for your business listing.");
      return;
    }

    setError("");
    setSubmitError("");
    setStep("preview");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitBusiness(businessName.trim(), category, area.trim(), coverMedia?.id);
      setStep("submitted");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit business. Please check details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "submitted") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          For businesses
        </p>
        <h1 className="mt-3 text-3xl font-bold text-on-surface">Business submitted</h1>
        <p className="mt-4 text-sm leading-6 text-on-surface-variant">
          Your business has been submitted to Cafnet for administrative review.
        </p>
        <div className="mt-8 border border-outline-variant bg-white p-5">
          <p className="font-semibold text-on-surface">Pending review</p>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            We will review the basic listing information before it becomes public. Once approved, you can complete your profile, menu, and operating hours in Business Center.
          </p>
        </div>
        <Link
          href="/business/dashboard"
          className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          View Business Center
        </Link>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
        <button
          type="button"
          className="text-sm font-semibold text-primary hover:text-[#0f46b8]"
          onClick={() => setStep("form")}
        >
          ← Edit details
        </button>
        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Review details
        </p>
        <h1 className="mt-3 text-3xl font-bold text-on-surface">Review your submission</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Please confirm these basic details before submitting for administrative review.
        </p>

        <div className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white">
          <div className="p-5">
            <p className="text-xs text-on-surface-variant">Business name</p>
            <p className="mt-1 font-semibold text-on-surface">{businessName.trim()}</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-on-surface-variant">Category</p>
            <p className="mt-1 font-semibold text-on-surface">
              {categories.find((item) => item.value === category)?.label}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-on-surface-variant">Neighborhood / Area</p>
            <p className="mt-1 font-semibold text-on-surface">{area.trim()}</p>
          </div>
          {coverMedia && coverMedia.url && (
            <div className="p-5">
              <p className="text-xs text-on-surface-variant mb-2">Cover photo</p>
              <div className="relative w-full h-56 rounded-xl overflow-hidden border border-outline-variant bg-surface-container">
                <Image
                  src={coverMedia.url}
                  alt={businessName}
                  fill
                  className="object-cover"
                  unoptimized={coverMedia.url.startsWith("http://localhost")}
                />
              </div>
            </div>
          )}
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600" role="alert">
            {submitError}
          </div>
        )}

        <button
          type="button"
          disabled={submitting}
          className="mt-7 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#0f46b8]"
          onClick={handleSubmit}
        >
          {submitting ? "Submitting for review..." : "Submit for review"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20">
      <Link href="/business" className="text-sm font-semibold text-primary">
        ← For businesses
      </Link>
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        New listing
      </p>
      <h1 className="mt-3 text-3xl font-bold text-on-surface">Add your business</h1>
      <p className="mt-3 text-sm leading-6 text-on-surface-variant">
        Can&apos;t find your business on Cafnet? Submit the basic information needed to create your listing. Full menu, photos, and hours can be configured after approval.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="new-business-name" className="block text-sm font-semibold text-on-surface">
            Business name
          </label>
          <input
            id="new-business-name"
            className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="e.g. Habesha Coffee & Eatery"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="new-business-category" className="block text-sm font-semibold text-on-surface">
            Category
          </label>
          <select
            id="new-business-category"
            className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={category}
            onChange={(event) => setCategory(event.target.value as BusinessSubmission["category"])}
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="new-business-area" className="block text-sm font-semibold text-on-surface">
            Neighborhood / area
          </label>
          <input
            id="new-business-area"
            className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="e.g. Bole Medhanialem"
            value={area}
            onChange={(event) => setArea(event.target.value)}
          />
        </div>

        <div>
          <ImageUpload
            targetType="submission"
            label="Cover photo"
            description="Upload 1 photo to represent your business listing (JPEG, PNG, WebP up to 10MB)"
            required
            initialImageUrl={coverMedia?.url}
            onUploadComplete={(media) => {
              setCoverMedia(media);
              setError("");
            }}
            onRemove={() => setCoverMedia(null)}
          />
        </div>

        {error && (
          <p className="text-sm font-semibold text-secondary" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={continueToPreview}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
