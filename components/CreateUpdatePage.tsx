"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBusinessOwner } from "./BusinessOwnerProvider";
import { getBusinessById } from "@/data/mockBusinesses";
import { formatUpdateDate, type BusinessUpdate, type UpdateType } from "@/data/businessUpdateStorage";
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
  const { ready, createUpdate, updateTypeOptions, getUpdateTypeLabel, getUpdateTypeIcon } = useBusinessOwner();
  const business = getBusinessById(businessId);

  const [formData, setFormData] = useState<Partial<Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status">>>({
    businessId: Number(businessId),
    type: "new_menu",
    title: "",
    description: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!ready || !business) return;
    setFormData((prev) => ({
      ...prev,
      businessId: Number(businessId),
    }));
  }, [ready, businessId, business]);

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

    if (!formData.type) {
      newErrors.type = "Update type is required";
    }

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    if (formData.type === "event") {
      if (formData.eventDate && formData.eventDate.trim().length > 0) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.eventDate)) {
          newErrors.eventDate = "Enter a valid date (YYYY-MM-DD)";
        }
      }
      if (formData.eventTime && formData.eventTime.trim().length > 0) {
        const timeRegex = /^\d{1,2}:\d{2} (AM|PM)$/i;
        if (!timeRegex.test(formData.eventTime)) {
          newErrors.eventTime = "Enter a valid time (e.g., 7:00 PM)";
        }
      }
    }

    if (formData.type === "offer" && formData.validUntil) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.validUntil)) {
        newErrors.validUntil = "Enter a valid date (YYYY-MM-DD)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const updateData: Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status"> = {
        businessId: Number(businessId),
        type: formData.type!,
        title: formData.title!.trim(),
        description: formData.description!.trim(),
        eventDate: formData.eventDate?.trim(),
        eventTime: formData.eventTime?.trim(),
        validUntil: formData.validUntil?.trim(),
        price: formData.price?.trim(),
        offerDetails: formData.offerDetails?.trim(),
      };

      await createUpdate(updateData);
      setShowSuccess(true);
      
      setTimeout(() => {
        router.push(`/business/dashboard/business/${businessId}/updates`);
      }, 1500);
    } catch (error) {
      console.error("Failed to create update:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, businessId, createUpdate, router]);

  if (!ready || !business) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Loading...</h1>
        <p className="mt-3 text-sm text-on-surface-variant">Preparing update form</p>
      </div>
    );
  }

  const canManage = business.claimStatus === "claimed";

  if (!canManage) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Access Denied</h1>
        <p className="mt-3 text-sm text-on-surface-variant">You do not have permission to create updates for this business.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  const selectedType = updateTypeOptions.find((opt) => opt.value === formData.type) || updateTypeOptions[0];

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
            Share what's new at your business with customers.
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
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g., Weekend Breakfast Menu"
                    maxLength={100}
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
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Tell customers what's new or useful about this update."
                    rows={4}
                    maxLength={500}
                    className={`mt-2 w-full rounded-xl border ${errors.description ? "border-error" : "border-outline-variant"} bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formData.description?.length || 0}/500 characters
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
                        Valid until
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
                Update published
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
                update={{
                  id: "preview",
                  businessId: Number(businessId),
                  type: formData.type || "new_menu",
                  title: formData.title || "Update title",
                  description: formData.description || "Update description",
                  createdAt: new Date().toISOString(),
                  publishedAt: new Date().toISOString(),
                  status: "published",
                }}
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
