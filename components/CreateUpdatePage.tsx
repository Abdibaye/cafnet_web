"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getManagedBusiness } from "@/lib/api/businesses";
import { createBusinessUpdate } from "@/lib/api/updates";
import {
  updateTypeOptions,
  type UpdateType,
  type BusinessUpdateViewModel,
} from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Business } from "@/lib/api/types";
import BusinessUpdateCard from "./BusinessUpdateCard";

type FormErrors = {
  type?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  eventTime?: string;
  validUntil?: string;
};

export default function CreateUpdatePage({ businessId }: { businessId: string }) {
  const router = useRouter();

  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    type: UpdateType;
    title: string;
    description: string;
    eventDate?: string;
    eventTime?: string;
    price?: string;
    offerDetails?: string;
    validUntil?: string;
  }>({
    type: "new_menu",
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorStatus(null);
      setErrorMessage(null);
      try {
        const b = await getManagedBusiness(businessId);
        if (!cancelled) {
          setBusiness(b);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setErrorStatus(err.status);
            setErrorMessage(err.message);
          } else {
            setErrorStatus(500);
            setErrorMessage("Failed to load business details");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const handleChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field as keyof FormErrors]: undefined,
      }));
    }
  }, [errors]);

  const handleTypeChange = useCallback((type: UpdateType) => {
    setFormData((prev) => ({
      ...prev,
      type,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (!formData.type) {
      newErrors.type = "Update type is required";
    }

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 120) {
      newErrors.title = "Title must be at most 120 characters";
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 5000) {
      newErrors.description = "Description must be at most 5000 characters";
    }

    if (formData.type === "event") {
      if (formData.eventDate && formData.eventDate.trim().length > 0) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.eventDate)) {
          newErrors.eventDate = "Enter a valid date (YYYY-MM-DD)";
        } else {
          const parts = formData.eventDate.split("-").map(Number);
          const eventTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
          if (eventTime < today) {
            newErrors.eventDate = "Event date cannot be in the past";
          }
        }
      }
      if (formData.eventTime && formData.eventTime.trim().length > 0) {
        const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM)?$/i;
        if (!timeRegex.test(formData.eventTime)) {
          newErrors.eventTime = "Enter a valid time (e.g., 7:00 PM)";
        }
      }
    }

    if (formData.type === "offer") {
      if (!formData.validUntil || !formData.validUntil.trim()) {
        newErrors.validUntil = "Expiration date is required for special offers";
      } else {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.validUntil)) {
          newErrors.validUntil = "Enter a valid date (YYYY-MM-DD)";
        } else {
          const parts = formData.validUntil.split("-").map(Number);
          const expTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
          if (expTime < today) {
            newErrors.validUntil = "Offer expiration date cannot be in the past";
          }
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createBusinessUpdate(businessId, {
        update_type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: formData.type === "event" && formData.eventDate ? formData.eventDate.trim() : undefined,
        event_time: formData.type === "event" && formData.eventTime ? formData.eventTime.trim() : undefined,
        price_text: formData.type === "price_update" && formData.price ? formData.price.trim() : undefined,
        offer_details: formData.type === "offer" && formData.offerDetails ? formData.offerDetails.trim() : undefined,
        valid_until: formData.type === "offer" && formData.validUntil ? formData.validUntil.trim() : undefined,
      });

      setShowSuccess(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cafnet:updates-updated"));
      }

      setTimeout(() => {
        router.push(`/business/dashboard/business/${businessId}/updates`);
      }, 1000);
    } catch (error) {
      console.error("Failed to create update:", error);
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Failed to create update. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, businessId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Loading...</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Preparing update form</p>
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Access Denied</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          You do not have permission to create updates for this business.
        </p>
        <Link
          href="/business/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]"
        >
          Back to Business Center
        </Link>
      </div>
    );
  }

  if (errorStatus === 404 || !business) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business Not Found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          {errorMessage || "The requested business could not be found."}
        </p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  const previewUpdate: BusinessUpdateViewModel = {
    id: "preview",
    businessId: business.id,
    type: formData.type || "new_menu",
    title: formData.title || "Update title",
    description: formData.description || "Update description will appear here as you type.",
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    eventDate: formData.type === "event" ? formData.eventDate : undefined,
    eventTime: formData.type === "event" ? formData.eventTime : undefined,
    price: formData.type === "price_update" ? formData.price : undefined,
    offerDetails: formData.type === "offer" ? formData.offerDetails : undefined,
    validUntil: formData.type === "offer" ? formData.validUntil : undefined,
    status: "published",
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      <div className="flex flex-col gap-4">
        <Link href={`/business/dashboard/business/${businessId}/updates`} className="text-sm font-semibold text-primary">
          ← Back to updates
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Create Update</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">Create a new update</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Share what's new at {business.name} with customers.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <main className="min-w-0">
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
            <section className="border border-outline-variant bg-white p-6">
              <h2 className="text-lg font-bold text-on-surface">Update details</h2>

              <div className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-on-surface">
                    Update type <span className="text-primary">*</span>
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {updateTypeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleTypeChange(option.value)}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                          formData.type === option.value
                            ? "bg-primary-container text-primary"
                            : "border border-outline-variant bg-white text-on-surface hover:border-primary/40"
                        }`}
                      >
                        {formData.type === option.value && (
                          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>
                        )}
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{option.icon}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {errors.type && <p className="mt-1 text-xs text-error">{errors.type}</p>}
                </div>

                <div>
                  <label htmlFor="title" className="block text-sm font-semibold text-on-surface">
                    Title <span className="text-primary">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., Weekend Breakfast Menu"
                    maxLength={120}
                    className={`mt-2 h-12 w-full rounded-xl border ${errors.title ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  {errors.title && <p className="mt-1 text-xs text-error">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-on-surface">
                    Description <span className="text-primary">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Tell customers what's new or useful about this update."
                    rows={4}
                    maxLength={5000}
                    className={`mt-2 w-full rounded-xl border ${errors.description ? "border-error" : "border-outline-variant"} bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formData.description.length}/5000 characters
                  </p>
                  {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
                </div>

                {formData.type === "event" && (
                  <>
                    <div>
                      <label htmlFor="eventDate" className="block text-sm font-semibold text-on-surface">
                        Date
                      </label>
                      <input
                        id="eventDate"
                        type="date"
                        value={formData.eventDate || ""}
                        onChange={(e) => handleChange("eventDate", e.target.value)}
                        className={`mt-2 h-12 w-full rounded-xl border ${errors.eventDate ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                      />
                      {errors.eventDate && <p className="mt-1 text-xs text-error">{errors.eventDate}</p>}
                    </div>
                    <div>
                      <label htmlFor="eventTime" className="block text-sm font-semibold text-on-surface">
                        Time
                      </label>
                      <input
                        id="eventTime"
                        type="text"
                        value={formData.eventTime || ""}
                        onChange={(e) => handleChange("eventTime", e.target.value)}
                        placeholder="e.g., 7:00 PM"
                        className={`mt-2 h-12 w-full rounded-xl border ${errors.eventTime ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                      />
                      {errors.eventTime && <p className="mt-1 text-xs text-error">{errors.eventTime}</p>}
                    </div>
                  </>
                )}

                {formData.type === "offer" && (
                  <>
                    <div>
                      <label htmlFor="offerDetails" className="block text-sm font-semibold text-on-surface">
                        Offer details
                      </label>
                      <input
                        id="offerDetails"
                        type="text"
                        value={formData.offerDetails || ""}
                        onChange={(e) => handleChange("offerDetails", e.target.value)}
                        placeholder="e.g., 20% off family meals"
                        className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                    <div>
                      <label htmlFor="validUntil" className="block text-sm font-semibold text-on-surface">
                        Valid until <span className="text-primary">*</span>
                      </label>
                      <input
                        id="validUntil"
                        type="date"
                        value={formData.validUntil || ""}
                        onChange={(e) => handleChange("validUntil", e.target.value)}
                        className={`mt-2 h-12 w-full rounded-xl border ${errors.validUntil ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                      />
                      {errors.validUntil && <p className="mt-1 text-xs text-error">{errors.validUntil}</p>}
                    </div>
                  </>
                )}

                {formData.type === "price_update" && (
                  <div>
                    <label htmlFor="price" className="block text-sm font-semibold text-on-surface">
                      Price information
                    </label>
                    <input
                      id="price"
                      type="text"
                      value={formData.price || ""}
                      onChange={(e) => handleChange("price", e.target.value)}
                      placeholder="e.g., Lunch buffet is now 450 ETB"
                      className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                )}
              </div>
            </section>

            {submitError && (
              <div className="rounded-xl border border-error/30 bg-error-container/20 p-4 text-sm text-error">
                {submitError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f46b8]"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">sync</span>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">publish</span>
                    Publish update
                  </>
                )}
              </button>
              <Link
                href={`/business/dashboard/business/${businessId}/updates`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-6 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                Cancel
              </Link>
            </div>

            {showSuccess && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
                Update published successfully
              </div>
            )}
          </form>
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[14px] border border-outline-variant bg-white p-6">
            <h2 className="text-lg font-bold text-on-surface">Preview</h2>
            <p className="mt-1 text-sm text-on-surface-variant">How this update will appear to customers</p>

            <div className="mt-6">
              <BusinessUpdateCard
                update={previewUpdate}
                business={business}
                showBusinessName
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
