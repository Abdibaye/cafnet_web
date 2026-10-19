"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useBusinessOwner } from "./BusinessOwnerProvider";
import { useCustomer } from "@/components/CustomerProvider";
import { getManagedBusiness, getBusinessHours, getBusinessImages, setBusinessImages, deleteBusinessImage } from "@/lib/api/businesses";
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

interface DisplayProfilePhoto {
  id: string;
  url: string;
  source: "media" | "business_image" | "cover_only";
  isCover: boolean;
  altText?: string;
  sortOrder?: number;
  originalMedia?: Media;
  originalImage?: BusinessImage;
}

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

  const ensureBusinessMedia = (m: unknown): BusinessMedia => {
    if (!m || typeof m !== "object") {
      return { cover: null, gallery: [] };
    }
    const obj = m as Partial<BusinessMedia>;
    return {
      cover: obj.cover || null,
      gallery: Array.isArray(obj.gallery) ? obj.gallery : [],
    };
  };

  const reloadMedia = useCallback(async () => {
    try {
      const [m, imgs, b] = await Promise.all([
        getBusinessMedia(businessId).catch(() => ({ cover: null, gallery: [] })),
        getBusinessImages(businessId).catch(() => []),
        getManagedBusiness(businessId).catch(() => null),
      ]);
      setBusinessMedia(ensureBusinessMedia(m));
      setLoadedImages(imgs);
      if (b) {
        setLoadedBusiness(b);
      }
    } catch {
      // Ignore media load failure
    }
  }, [businessId]);

  const [photoToDelete, setPhotoToDelete] = useState<DisplayProfilePhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<DisplayProfilePhoto | null>(null);
  const [settingCoverId, setSettingCoverId] = useState<string | null>(null);

  // Unified list of all photos currently belonging to this business profile
  const allProfilePhotos = useMemo<DisplayProfilePhoto[]>(() => {
    const list: DisplayProfilePhoto[] = [];
    const seenUrls = new Set<string>();

    const activeCoverUrl = (businessMedia?.cover?.url || loadedBusiness?.cover_image || "").trim();

    // 1. Tigris media cover
    if (businessMedia?.cover?.url) {
      const url = businessMedia.cover.url.trim();
      seenUrls.add(url);
      list.push({
        id: String(businessMedia.cover.id),
        url,
        source: "media",
        isCover: true,
        altText: "Cover photo",
        originalMedia: businessMedia.cover,
      });
    }

    // 2. Direct cover_image from business
    if (loadedBusiness?.cover_image && !seenUrls.has(loadedBusiness.cover_image.trim())) {
      const url = loadedBusiness.cover_image.trim();
      seenUrls.add(url);
      list.push({
        id: `biz-cover-${businessId}`,
        url,
        source: "cover_only",
        isCover: true,
        altText: `${loadedBusiness.name || "Business"} cover`,
      });
    }

    // 3. Tigris media gallery
    for (const m of businessMedia?.gallery || []) {
      if (!m.url) continue;
      const url = m.url.trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        list.push({
          id: String(m.id),
          url,
          source: "media",
          isCover: activeCoverUrl !== "" && activeCoverUrl === url,
          altText: "Gallery photo",
          sortOrder: m.sort_order,
          originalMedia: m,
        });
      }
    }

    // 4. Scraped / direct business_images
    for (const img of loadedImages || []) {
      if (!img.image_url) continue;
      const url = img.image_url.trim();
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        list.push({
          id: String(img.id),
          url,
          source: "business_image",
          isCover: activeCoverUrl !== "" && activeCoverUrl === url,
          altText: img.alt_text || "Venue photo",
          sortOrder: img.sort_order,
          originalImage: img,
        });
      }
    }

    return list;
  }, [businessMedia, loadedBusiness, loadedImages, businessId]);

  const handleConfirmDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeletingPhoto(true);
    try {
      if (photoToDelete.source === "media") {
        await deleteMedia(photoToDelete.id);
      } else if (photoToDelete.source === "business_image") {
        await deleteBusinessImage(businessId, photoToDelete.id);
      } else {
        // Fallback: check media cover or loadedImages
        if (businessMedia?.cover?.id) {
          await deleteMedia(businessMedia.cover.id).catch(() => {});
        }
        const matchedImg = loadedImages.find(
          (img) => img.id === photoToDelete.id || img.image_url === photoToDelete.url,
        );
        if (matchedImg) {
          await deleteBusinessImage(businessId, matchedImg.id).catch(() => {});
        }
      }

      showToast("Photo deleted successfully");
      setPhotoToDelete(null);
      if (previewPhoto?.id === photoToDelete.id) {
        setPreviewPhoto(null);
      }
      await reloadMedia();
    } catch {
      showToast("Failed to delete photo");
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleSetCoverPhoto = async (photo: DisplayProfilePhoto) => {
    setSettingCoverId(photo.id);
    try {
      if (photo.source === "media" && photo.originalMedia) {
        await setBusinessCover(businessId, photo.originalMedia.id);
      } else if (photo.originalImage || photo.source === "business_image") {
        const targetImg = photo.originalImage || loadedImages.find((i) => i.id === photo.id || i.image_url === photo.url);
        if (targetImg) {
          const reordered = [
            targetImg,
            ...loadedImages.filter((img) => img.id !== targetImg.id),
          ].map((img, idx) => ({ ...img, sort_order: idx }));
          await setBusinessImages(businessId, reordered);
        }
      }
      showToast("Set as primary cover photo");
      await reloadMedia();
    } catch {
      showToast("Failed to set cover photo");
    } finally {
      setSettingCoverId(null);
    }
  };

  const handleMovePhoto = async (index: number, direction: "prev" | "next") => {
    const targetIndex = direction === "prev" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= allProfilePhotos.length) return;

    const photoA = allProfilePhotos[index];
    const photoB = allProfilePhotos[targetIndex];

    if (photoA.source === "business_image" && photoB.source === "business_image") {
      const copy = [...loadedImages];
      const fromIdx = copy.findIndex((i) => i.id === photoA.id);
      const toIdx = copy.findIndex((i) => i.id === photoB.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        const reordered = copy.map((item, idx) => ({ ...item, sort_order: idx }));
        try {
          await setBusinessImages(businessId, reordered);
          await reloadMedia();
          showToast("Photo order updated");
        } catch {
          showToast("Failed to update photo order");
        }
      }
    } else if (photoA.source === "media" && photoB.source === "media") {
      const copy = [...(businessMedia?.gallery || [])];
      const fromIdx = copy.findIndex((i) => i.id === photoA.id);
      const toIdx = copy.findIndex((i) => i.id === photoB.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        try {
          await reorderBusinessGallery(businessId, copy.map((i) => i.id));
          await reloadMedia();
          showToast("Photo order updated");
        } catch {
          showToast("Failed to update photo order");
        }
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewPhoto) {
          setPreviewPhoto(null);
        } else if (photoToDelete) {
          setPhotoToDelete(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewPhoto, photoToDelete]);

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
          setBusinessMedia(ensureBusinessMedia(media));

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/60 pb-5">
                <div>
                  <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">photo_library</span>
                    Photos & Media
                  </h2>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Manage your business cover photo and gallery images. Photos appear on your public listing and search cards.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-on-surface self-start sm:self-center">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  {allProfilePhotos.length} {allProfilePhotos.length === 1 ? "photo" : "photos"} in profile
                </div>
              </div>

              {/* Cover Photo */}
              <div className="py-6 border-b border-outline-variant/60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-amber-500 text-[18px]">star</span>
                      Primary Cover Photo
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      The prominent photo displayed at the top of your public profile and on search result cards.
                    </p>
                  </div>
                  {(businessMedia?.cover?.url || loadedBusiness?.cover_image) && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Active Cover
                    </span>
                  )}
                </div>
                <div className="max-w-md mt-4">
                  <ImageUpload
                    targetType="business_cover"
                    targetId={businessId}
                    currentImageUrl={businessMedia?.cover?.url || loadedBusiness?.cover_image}
                    onUploadComplete={() => {
                      showToast("Cover photo updated");
                      reloadMedia();
                    }}
                    onRemove={async () => {
                      try {
                        if (businessMedia?.cover) {
                          await deleteMedia(businessMedia.cover.id);
                        } else if (loadedImages.length > 0) {
                          await deleteBusinessImage(businessId, loadedImages[0].id);
                        }
                        showToast("Cover photo removed");
                        await reloadMedia();
                      } catch {
                        showToast("Failed to remove cover photo");
                      }
                    }}
                  />
                </div>
              </div>

              {/* Gallery Photos (Current Profile Photos) */}
              <div className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">collections</span>
                      Current Business Photos ({allProfilePhotos.length})
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      All photos currently visible on your public business page. Click any photo to preview, set as cover, or delete.
                    </p>
                  </div>
                </div>

                {allProfilePhotos.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-outline-variant/80 p-8 text-center bg-surface-container-lowest mb-6">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                      <span className="material-symbols-outlined text-[24px]">no_photography</span>
                    </div>
                    <p className="text-sm font-semibold text-on-surface">No photos in profile yet</p>
                    <p className="text-xs text-on-surface-variant mt-1 max-w-sm mx-auto">
                      Add photos below to showcase your venue, menu items, ambience, and interior to visitors.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {allProfilePhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className={`group relative rounded-xl border overflow-hidden bg-white shadow-xs transition-all duration-200 hover:shadow-md ${
                          photo.isCover ? "border-amber-400 ring-2 ring-amber-400/20" : "border-outline-variant/60 hover:border-primary/40"
                        }`}
                      >
                        {/* Image Thumbnail with Overlay */}
                        <div
                          className="relative h-32 w-full bg-surface-container overflow-hidden cursor-pointer"
                          onClick={() => setPreviewPhoto(photo)}
                          title="Click to view full size"
                        >
                          <img
                            src={photo.url}
                            alt={photo.altText || `Business photo ${idx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                            }}
                          />
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
                            {photo.isCover && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/95 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                <span className="material-symbols-outlined text-[12px]">star</span>
                                Cover
                              </span>
                            )}
                          </div>

                          {/* Hover preview icon */}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-on-surface shadow-md">
                              <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                            </span>
                          </div>
                        </div>

                        {/* Photo Card Action Bar */}
                        <div className="p-2.5 bg-white flex flex-col gap-2 border-t border-outline-variant/40">
                          {/* Set as Cover / Current Cover status */}
                          {photo.isCover ? (
                            <div className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-1 text-[11px] font-semibold text-amber-800">
                              <span className="material-symbols-outlined text-[13px] text-amber-600">check_circle</span>
                              Primary Cover
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={settingCoverId === photo.id}
                              onClick={() => handleSetCoverPhoto(photo)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-outline-variant px-2 py-1 text-[11px] font-semibold text-on-surface hover:bg-surface-container hover:text-primary transition-colors disabled:opacity-50"
                              title="Make this photo the listing cover"
                            >
                              {settingCoverId === photo.id ? (
                                <span className="inline-block size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                                <span className="material-symbols-outlined text-[13px] text-primary">star</span>
                              )}
                              Set as cover
                            </button>
                          )}

                          {/* Lower controls: Preview, Reorder, Delete */}
                          <div className="flex items-center justify-between pt-0.5 border-t border-outline-variant/20">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setPreviewPhoto(photo)}
                                className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
                                title="View full size photo"
                              >
                                <span className="material-symbols-outlined text-[16px]">visibility</span>
                              </button>
                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(idx, "prev")}
                                  className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container"
                                  title="Move photo earlier"
                                >
                                  <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                                </button>
                              )}
                              {idx < allProfilePhotos.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleMovePhoto(idx, "next")}
                                  className="inline-flex size-7 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container"
                                  title="Move photo later"
                                >
                                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                                </button>
                              )}
                            </div>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => setPhotoToDelete(photo)}
                              className="inline-flex size-7 items-center justify-center rounded-md text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete this photo"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload New Photo */}
                {allProfilePhotos.length < 20 ? (
                  <div className="max-w-md pt-2">
                    <p className="text-xs font-semibold text-on-surface mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-primary">add_photo_alternate</span>
                      Upload additional photo to gallery
                    </p>
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
                    Maximum limit of 20 photos reached. Delete an existing image to upload a new one.
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
                  src={businessMedia?.cover?.url || loadedBusiness?.cover_image || "/images/cafnet-placeholder.svg"}
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

              {Array.isArray(formData.tags) && formData.tags.length > 0 && (
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
                  {Array.isArray(formData.openingHours) && formData.openingHours.length > 0 ? (
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

      {/* Delete Photo Confirmation Modal */}
      {photoToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-photo-dialog-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-outline-variant">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <span className="material-symbols-outlined text-[24px]">delete_forever</span>
              </div>
              <div className="flex-1">
                <h3 id="delete-photo-dialog-title" className="text-lg font-bold text-on-surface">
                  Delete Photo?
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Are you sure you want to permanently delete this photo from your business profile? This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-surface-container border border-outline-variant/60">
              <img
                src={photoToDelete.url}
                alt="To delete"
                className="size-16 rounded-lg object-cover border border-outline-variant/40"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-on-surface truncate">
                  {photoToDelete.altText || "Business photo"}
                </p>
                {photoToDelete.isCover && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                    <span className="material-symbols-outlined text-[12px]">warning</span>
                    Currently set as primary cover
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={() => setPhotoToDelete(null)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingPhoto}
                onClick={handleConfirmDeletePhoto}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 shadow-xs"
              >
                {isDeletingPhoto ? (
                  <>
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete Photo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Size Photo Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-4xl w-full flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-black/40 text-white border-b border-white/10 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">image</span>
                <span className="text-sm font-semibold truncate max-w-xs sm:max-w-md">
                  {previewPhoto.altText || "Photo preview"}
                </span>
                {previewPhoto.isCover && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                    <span className="material-symbols-outlined text-[12px]">star</span>
                    Cover
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="inline-flex size-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Close preview (Esc)"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Image Content */}
            <div className="flex items-center justify-center bg-black/60 p-4 max-h-[70vh] overflow-hidden">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.altText || "Full size photo"}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                }}
              />
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-t border-outline-variant/60">
              <div>
                {!previewPhoto.isCover ? (
                  <button
                    type="button"
                    disabled={settingCoverId === previewPhoto.id}
                    onClick={() => {
                      handleSetCoverPhoto(previewPhoto);
                      setPreviewPhoto((prev) => (prev ? { ...prev, isCover: true } : null));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px] text-primary">star</span>
                    Set as Primary Cover
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    Current Primary Cover
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = previewPhoto;
                    setPreviewPhoto(null);
                    setPhotoToDelete(target);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  Delete Photo
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(null)}
                  className="rounded-xl bg-surface-container px-4 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
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
