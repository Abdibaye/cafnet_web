"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBusinessOwner } from "./BusinessOwnerProvider";
import { useCustomer } from "@/components/CustomerProvider";
import { getManagedBusiness, getBusinessHours, getBusinessImages } from "@/lib/api/businesses";
import { getBusinessMedia, setBusinessCover, reorderBusinessGallery, deleteMedia } from "@/lib/api/media";
import { businessToEditableData } from "@/lib/api/adapters";
import { ApiError } from "@/lib/api/errors";
import type { Business, BusinessCategory, BusinessHours, BusinessImage, BusinessMedia, Media } from "@/lib/api/types";
import type { EditableBusinessData, OpeningHours } from "@/data/ownerManagedBusinessStorage";
import ImageUpload from "@/components/ImageUpload";

type FormErrors = {
  name?: string;
  phone?: string;
  website?: string;
  description?: string;
};

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTimeForDisplay(time: string): string {
  if (!time) return "";
  const [timePart, period] = time.split(" ");
  if (!timePart || !period) return time;
  const [hours, minutes] = timePart.split(":");
  return `${hours}:${minutes || "00"} ${period}`;
}

function parseTimeInput(value: string): string {
  if (!value) return "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned;
}

function formatPhoneForDisplay(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, "$1 $2 $3 $4").replace(/\s+/g, " ").trim();
}

function formatPhoneForStorage(phone: string): string {
  return phone.replace(/\s+/g, "");
}

export default function EditBusinessPage({ businessId }: { businessId: string }) {
  const router = useRouter();
  const { showToast } = useCustomer();
  const { 
    ready, 
    updateManagedBusiness,
    availableTags,
    priceRangeOptions,
    categoryOptions,
  } = useBusinessOwner();
  
  const [loadedBusiness, setLoadedBusiness] = useState<Business | null>(null);
  const [loadedHours, setLoadedHours] = useState<BusinessHours[]>([]);
  const [loadedImages, setLoadedImages] = useState<BusinessImage[]>([]);
  const [businessMedia, setBusinessMedia] = useState<BusinessMedia>({ cover: null, gallery: [] });
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const initialDataRef = useRef<EditableBusinessData | null>(null);

  const reloadMedia = useCallback(async () => {
    try {
      const m = await getBusinessMedia(businessId);
      setBusinessMedia(m);
    } catch {
      // Ignore media load failure
    }
  }, [businessId]);

  const [formData, setFormData] = useState<Partial<EditableBusinessData>>({
    businessId: Number(businessId),
    name: "",
    description: "",
    phone: "",
    location: "",
    category: "restaurant",
    priceRange: "",
    website: "",
    openingHours: [],
    tags: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setErrorStatus(null);
      try {
        const [b, hours, images, media] = await Promise.all([
          getManagedBusiness(businessId),
          getBusinessHours(businessId).catch(() => []),
          getBusinessImages(businessId).catch(() => []),
          getBusinessMedia(businessId).catch(() => ({ cover: null, gallery: [] })),
        ]);
        if (!cancelled) {
          setLoadedBusiness(b);
          setLoadedHours(hours);
          setLoadedImages(images);
          setBusinessMedia(media);

          const initialData = businessToEditableData(b, hours);
          initialDataRef.current = initialData;
          setFormData({
            businessId: initialData.businessId,
            name: initialData.name,
            description: initialData.description,
            phone: initialData.phone,
            location: initialData.location,
            category: initialData.category,
            priceRange: initialData.priceRange,
            website: initialData.website,
            openingHours: initialData.openingHours,
            tags: initialData.tags,
          });
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setErrorStatus(err.status);
          } else {
            setErrorStatus(404);
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

  const handleChange = useCallback((field: keyof EditableBusinessData, value: string | string[] | OpeningHours[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsFormDirty(true);
    
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field as keyof FormErrors]: undefined,
      }));
    }
  }, [errors]);

  const handleHoursChange = useCallback((dayIndex: number, field: "open" | "close" | "isClosed", value: string | boolean) => {
    setFormData((prev) => {
      const updatedHours = [...(prev.openingHours || [])];
      if (!updatedHours[dayIndex]) {
        updatedHours[dayIndex] = { day: daysOfWeek[dayIndex], open: "10:00 AM", close: "10:00 PM", isClosed: false };
      }
      updatedHours[dayIndex] = {
        ...updatedHours[dayIndex],
        [field]: value,
      };
      return {
        ...prev,
        openingHours: updatedHours,
      };
    });
    setIsFormDirty(true);
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    setFormData((prev) => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      return {
        ...prev,
        tags: newTags,
      };
    });
    setIsFormDirty(true);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = "Business name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Business name must be less than 100 characters";
    }

    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^\+251\d{9,12}$/;
      const formattedPhone = formatPhoneForStorage(formData.phone);
      if (!phoneRegex.test(formattedPhone.replace(/\s+/g, ""))) {
        newErrors.phone = "Enter a valid Ethiopian phone number (e.g., +251 9XX XXX XXX)";
      }
    }

    if (formData.website && formData.website.trim().length > 0) {
      const urlRegex = /^https?:\/\/.+/;
      if (!urlRegex.test(formData.website) && !formData.website.startsWith("http://") && !formData.website.startsWith("https://")) {
        newErrors.website = "Enter a valid URL (e.g., https://example.com)";
      }
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const hasChanges = useMemo(() => {
    if (!initialDataRef.current) return false;
    const initial = initialDataRef.current;
    if (formData.name !== initial.name) return true;
    if (formData.description !== initial.description) return true;
    if (formData.phone !== initial.phone) return true;
    if (formData.location !== initial.location) return true;
    if (formData.category !== initial.category) return true;
    if (formData.priceRange !== initial.priceRange) return true;
    if (formData.website !== initial.website) return true;
    if (JSON.stringify(formData.tags || []) !== JSON.stringify(initial.tags || [])) return true;
    if (JSON.stringify(formData.openingHours || []) !== JSON.stringify(initial.openingHours || [])) return true;
    return false;
  }, [formData]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const dataToSave: Partial<EditableBusinessData> = {
        businessId: formData.businessId,
        name: formData.name?.trim(),
        description: formData.description?.trim(),
        phone: formData.phone ? formatPhoneForStorage(formData.phone) : "",
        location: formData.location?.trim(),
        category: formData.category,
        priceRange: formData.priceRange,
        website: formData.website?.trim(),
        openingHours: formData.openingHours,
        tags: formData.tags,
        updatedAt: new Date().toISOString(),
      };

      await updateManagedBusiness(Number(businessId), dataToSave);

      initialDataRef.current = {
        ...(initialDataRef.current || {}),
        ...dataToSave,
      } as EditableBusinessData;

      setSaveSuccess(true);
      setIsFormDirty(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      if (error instanceof ApiError) {
        setSaveError(error.message || "Failed to update business");
      } else {
        setSaveError("Failed to save changes. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, formData, businessId, updateManagedBusiness]);

  const handleCancel = useCallback(() => {
    if (isFormDirty && hasChanges) {
      setShowUnsavedDialog(true);
    } else {
      router.push(`/business/dashboard/business/${businessId}`);
    }
  }, [isFormDirty, hasChanges, businessId, router]);

  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedDialog(false);
    router.push(`/business/dashboard/business/${businessId}`);
  }, [router, businessId]);

  const handleStay = useCallback(() => {
    setShowUnsavedDialog(false);
  }, []);

  const handleNavigateAway = useCallback((e: BeforeUnloadEvent) => {
    if (hasChanges) {
      e.preventDefault();
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
    }
  }, [hasChanges]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleNavigateAway);
    return () => window.removeEventListener("beforeunload", handleNavigateAway);
  }, [handleNavigateAway]);

  if (loading || !ready) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-20 text-center text-sm text-on-surface-variant">
        Loading business editor...
      </div>
    );
  }

  if (errorStatus === 403) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
          <span className="material-symbols-outlined text-3xl">lock</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-on-surface">Access restricted</h1>
        <p className="mt-3 text-sm text-on-surface-variant">You must have verified management rights to edit this business listing.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Back to Business Center
        </Link>
      </div>
    );
  }

  if (errorStatus === 404 || !loadedBusiness) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Business not found</h1>
        <p className="mt-3 text-sm text-on-surface-variant">This business may no longer be available.</p>
        <Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">
          Business Center
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 lg:px-0 lg:py-16">
      <div className="flex flex-col gap-4">
        <Link href={`/business/dashboard/business/${businessId}`} className="text-sm font-semibold text-primary">
          ← Back to business
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Edit listing</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">Edit your business information</h1>
          <p className="mt-3 text-sm text-on-surface-variant">
            Update the information customers see about your business on Cafnet.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <main className="min-w-0">
          <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); void handleSave(); }}>
            <section className="border border-outline-variant bg-white p-6">
              <h2 className="text-lg font-bold text-on-surface">Basic information</h2>
              <p className="mt-1 text-sm text-on-surface-variant">The essential details about your business</p>
              
              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="business-name" className="block text-sm font-semibold text-on-surface">
                    Business name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="business-name"
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Enter your business name"
                    className={`mt-2 h-12 w-full rounded-xl border ${errors.name ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-on-surface">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category || "restaurant"}
                    onChange={(e) => handleChange("category", e.target.value as BusinessCategory)}
                    className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-on-surface">
                    About this place
                  </label>
                  <textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Tell customers what makes your place special."
                    rows={4}
                    maxLength={1000}
                    className={`mt-2 w-full rounded-xl border ${errors.description ? "border-error" : "border-outline-variant"} bg-white px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {formData.description?.length || 0}/1000 characters
                  </p>
                  {errors.description && <p className="mt-1 text-xs text-error">{errors.description}</p>}
                </div>
              </div>
            </section>

            <section className="border border-outline-variant bg-white p-6">
              <h2 className="text-lg font-bold text-on-surface">Contact & location</h2>
              
              <div className="mt-6 space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-on-surface">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={formatPhoneForDisplay(formData.phone || "")}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+251 9XX XXX XXX"
                    className={`mt-2 h-12 w-full rounded-xl border ${errors.phone ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-error">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-semibold text-on-surface">
                    Website
                  </label>
                  <input
                    id="website"
                    type="url"
                    value={formData.website || ""}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className={`mt-2 h-12 w-full rounded-xl border ${errors.website ? "border-error" : "border-outline-variant"} bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15`}
                  />
                  {errors.website && <p className="mt-1 text-xs text-error">{errors.website}</p>}
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-on-surface">
                    Location / Address
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location || ""}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="e.g., Bole Medhanialem, Addis Ababa"
                    className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <div>
                  <label htmlFor="price-range" className="block text-sm font-semibold text-on-surface">
                    Price range
                  </label>
                  <select
                    id="price-range"
                    value={formData.priceRange || ""}
                    onChange={(e) => handleChange("priceRange", e.target.value)}
                    className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">Select price range</option>
                    {priceRangeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="border border-outline-variant bg-white p-6">
              <h2 className="text-lg font-bold text-on-surface">Opening hours</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Set your regular business hours</p>
              
              <div className="mt-6 space-y-4">
                {(formData.openingHours || []).map((hour, index) => (
                  <div key={hour.day || index} className="flex items-center gap-3">
                    <span className="w-20 text-sm font-medium text-on-surface">{hour.day}</span>
                    <select
                      value={hour.isClosed ? "closed" : "open"}
                      onChange={(e) => {
                        const isClosed = e.target.value === "closed";
                        handleHoursChange(index, "isClosed", isClosed);
                        if (!isClosed) {
                          handleHoursChange(index, "open", "10:00 AM");
                          handleHoursChange(index, "close", "10:00 PM");
                        }
                      }}
                      className="h-10 w-24 rounded-xl border border-outline-variant bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                    </select>
                    {!hour.isClosed && (
                      <>
                        <select
                          value={hour.open || "10:00 AM"}
                          onChange={(e) => handleHoursChange(index, "open", e.target.value)}
                          className="h-10 w-28 rounded-xl border border-outline-variant bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        >
                          {generateTimeOptions()}
                        </select>
                        <span className="text-on-surface-variant">–</span>
                        <select
                          value={hour.close || "10:00 PM"}
                          onChange={(e) => handleHoursChange(index, "close", e.target.value)}
                          className="h-10 w-28 rounded-xl border border-outline-variant bg-white px-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                        >
                          {generateTimeOptions()}
                        </select>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Photos & Media Management */}
            <section className="border border-outline-variant bg-white p-6 rounded-2xl">
              <div>
                <h2 className="text-lg font-bold text-on-surface">Photos & Media</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Manage your business cover photo and gallery (up to 20 images)
                </p>
              </div>

              {/* Cover Photo */}
              <div className="mt-6 border-b border-outline-variant/60 pb-6">
                <h3 className="text-sm font-bold text-on-surface mb-1">Cover Photo</h3>
                <p className="text-xs text-on-surface-variant mb-4">
                  The primary photo shown on search cards and at the top of your public profile.
                </p>
                <div className="max-w-md">
                  <ImageUpload
                    targetType="business_cover"
                    targetId={businessId}
                    currentImageUrl={businessMedia.cover?.url || loadedBusiness?.cover_image}
                    onUploadComplete={() => {
                      showToast("Cover photo updated");
                      reloadMedia();
                    }}
                    onRemove={async () => {
                      if (businessMedia.cover) {
                        try {
                          await deleteMedia(businessMedia.cover.id);
                          showToast("Cover photo removed");
                          reloadMedia();
                        } catch {
                          showToast("Failed to remove cover photo");
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Gallery Photos */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Gallery Photos</h3>
                    <p className="text-xs text-on-surface-variant">
                      {businessMedia.gallery.length} of 20 photos uploaded
                    </p>
                  </div>
                </div>

                {businessMedia.gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {businessMedia.gallery.map((img: Media, idx: number) => (
                      <div
                        key={img.id}
                        className="group relative rounded-xl border border-outline-variant/60 overflow-hidden bg-surface-container"
                      >
                        <img
                          src={img.url}
                          alt={`Gallery photo ${idx + 1}`}
                          className="h-28 w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                          }}
                        />
                        <div className="p-2 bg-white flex flex-col gap-1.5 border-t border-outline-variant/40">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await setBusinessCover(businessId, img.id);
                                showToast("Set as cover photo");
                                reloadMedia();
                              } catch {
                                showToast("Failed to set cover photo");
                              }
                            }}
                            className="inline-flex items-center justify-center gap-1 rounded-lg border border-outline-variant px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px] text-primary">star</span>
                            Set as cover
                          </button>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={async () => {
                                  const items = [...businessMedia.gallery];
                                  const [moved] = items.splice(idx, 1);
                                  items.splice(idx - 1, 0, moved);
                                  try {
                                    await reorderBusinessGallery(businessId, items.map((i) => i.id));
                                    reloadMedia();
                                  } catch {
                                    showToast("Failed to reorder");
                                  }
                                }}
                                className="inline-flex size-6 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                                title="Move earlier"
                              >
                                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                              </button>
                              <button
                                type="button"
                                disabled={idx === businessMedia.gallery.length - 1}
                                onClick={async () => {
                                  const items = [...businessMedia.gallery];
                                  const [moved] = items.splice(idx, 1);
                                  items.splice(idx + 1, 0, moved);
                                  try {
                                    await reorderBusinessGallery(businessId, items.map((i) => i.id));
                                    reloadMedia();
                                  } catch {
                                    showToast("Failed to reorder");
                                  }
                                }}
                                className="inline-flex size-6 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                                title="Move later"
                              >
                                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await deleteMedia(img.id);
                                  showToast("Photo deleted");
                                  reloadMedia();
                                } catch {
                                  showToast("Failed to delete photo");
                                }
                              }}
                              className="inline-flex size-6 items-center justify-center rounded text-red-600 hover:bg-red-50"
                              title="Delete photo"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {businessMedia.gallery.length < 20 ? (
                  <div className="max-w-md">
                    <p className="text-xs font-semibold text-on-surface mb-2">Add a photo to gallery</p>
                    <ImageUpload
                      targetType="business_gallery"
                      targetId={businessId}
                      onUploadComplete={() => {
                        showToast("Photo added to gallery");
                        reloadMedia();
                      }}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    Maximum limit of 20 gallery photos reached. Remove an image to upload a new one.
                  </p>
                )}
              </div>
            </section>

            <section className="border border-outline-variant bg-white p-6">
              <h2 className="text-lg font-bold text-on-surface">Features</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Help customers know what to expect</p>
              
              <div className="mt-6 flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = (formData.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-primary-container text-primary"
                          : "border border-outline-variant bg-white text-on-surface hover:border-primary/40"
                      }`}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check</span>}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSaving || !isFormDirty}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0f46b8]"
              >
                {isSaving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin" aria-hidden="true">sync</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">save</span>
                    Save changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-6 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                Cancel
              </button>
            </div>

            {saveSuccess && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-4 py-2.5 text-sm font-semibold text-primary">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>
                Listing updated
              </div>
            )}

            {saveError && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">error</span>
                {saveError}
              </div>
            )}
          </form>
        </main>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[14px] border border-outline-variant bg-white p-6">
            <h2 className="text-lg font-bold text-on-surface">Live preview</h2>
            <p className="mt-1 text-sm text-on-surface-variant">This is what customers will see</p>
            
            <div className="mt-6">
              <div className="flex items-center gap-3">
                <img
                  src={businessMedia.cover?.url || loadedBusiness?.cover_image || "/images/cafnet-placeholder.svg"}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                  }}
                />
                <div>
                  <h3 className="text-lg font-bold text-on-surface">{formData.name || loadedBusiness?.name}</h3>
                  <p className="text-sm text-on-surface-variant">
                    {categoryOptions.find((c) => c.value === formData.category)?.label || loadedBusiness?.cuisine || "Restaurant"}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-on-surface">About</h4>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  {formData.description || loadedBusiness?.description}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {formData.phone && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                      call
                    </span>
                    <span className="text-sm text-on-surface">{formatPhoneForDisplay(formData.phone)}</span>
                  </div>
                )}
                {formData.location && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                      location_on
                    </span>
                    <span className="text-sm text-on-surface">{formData.location}</span>
                  </div>
                )}
                {formData.priceRange && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                      payments
                    </span>
                    <span className="text-sm text-on-surface">{formData.priceRange}</span>
                  </div>
                )}
                {formData.website && (
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">
                      language
                    </span>
                    <span className="text-sm text-on-surface">{formData.website}</span>
                  </div>
                )}
              </div>

              {formData.tags && formData.tags.length > 0 && (
                <div className="mt-5">
                  <h4 className="text-sm font-semibold text-on-surface">Features</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-white px-3 py-1 text-xs font-medium text-on-surface"
                      >
                        <span className="material-symbols-outlined text-[14px] text-secondary" aria-hidden="true">
                          check_circle
                        </span>
                        {tag}
                      </span>
                    ))}
                    {formData.tags.length > 4 && (
                      <span className="text-xs text-on-surface-variant">+{formData.tags.length - 4} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <h4 className="text-sm font-semibold text-on-surface">Hours</h4>
                <div className="mt-2 text-sm text-on-surface-variant">
                  {formData.openingHours && formData.openingHours.length > 0 ? (
                    <>
                      {formData.openingHours[0].isClosed ? (
                        <p>Closed</p>
                      ) : (
                        <p>
                          {formatTimeForDisplay(formData.openingHours[0].open)} – {formatTimeForDisplay(formData.openingHours[0].close)}
                        </p>
                      )}
                      {formData.openingHours.length > 1 && (
                        <p className="mt-1 text-xs">+{formData.openingHours.length - 1} more days</p>
                      )}
                    </>
                  ) : (
                    <p>Hours not set</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-outline-variant pt-4">
              <Link
                href={`/business/${businessId}`}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                View public profile
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {showUnsavedDialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/30 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowUnsavedDialog(false);
          }}
        >
          <section
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(20,33,61,0.18)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unsaved-changes-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="unsaved-changes-title" className="text-xl font-bold text-on-surface">
                  Unsaved changes
                </h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                  You have unsaved changes. Are you sure you want to leave?
                </p>
              </div>
              <button
                type="button"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low"
                aria-label="Close dialog"
                onClick={() => setShowUnsavedDialog(false)}
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleStay}
                className="flex-1 h-11 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]"
              >
                Stay
              </button>
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="flex-1 h-11 rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
              >
                Discard changes
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function generateTimeOptions(): React.JSX.Element[] {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const period = hour < 12 ? "AM" : "PM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const time = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
      options.push(
        <option key={time} value={time}>
          {time}
        </option>
      );
    }
  }
  return options;
}
