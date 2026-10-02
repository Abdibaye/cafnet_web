"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import type { BusinessClaim, BusinessSubmission } from "@/data/businessOwnerStorage";
import {
  availableTags,
  priceRangeOptions,
  categoryOptions,
  type OwnerManagedBusiness,
  type EditableBusinessData,
} from "@/data/ownerManagedBusinessStorage";
import {
  getUpdatesByBusiness as getUpdatesByBusinessFromStorage,
  createUpdate as createUpdateInStorage,
  updateUpdate as updateUpdateInStorage,
  deleteUpdate as deleteUpdateInStorage,
  getUpdateById as getUpdateByIdFromStorage,
} from "@/data/businessUpdateStorage";
import {
  updateTypeOptions,
  getUpdateTypeLabel as getUpdateTypeLabelAdapter,
  getUpdateTypeIcon as getUpdateTypeIconAdapter,
  type BusinessUpdateViewModel as BusinessUpdate,
  type UpdateType,
} from "@/lib/api/adapters";
import type { Business, BusinessHours } from "@/lib/api/types";
import {
  getManagedBusinesses,
  updateManagedBusiness as updateManagedBusinessApi,
  getBusinessHours,
  setBusinessHours,
} from "@/lib/api/businesses";
import {
  getMyClaims,
  getMySubmissions,
  submitClaim as submitClaimApi,
  createSubmission as createSubmissionApi,
} from "@/lib/api/customer";
import {
  apiClaimToViewModel,
  apiSubmissionToViewModel,
  businessToOwnerManaged,
  editableDataToUpdateInput,
  openingHoursToBusinessHours,
} from "@/lib/api/adapters";

type BusinessOwnerContextValue = {
  ready: boolean;
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
  managedBusinesses: OwnerManagedBusiness[];
  rawManagedBusinesses: Business[];
  isBusinessManaged: (businessId: number) => boolean;
  getClaim: (businessId: number) => BusinessClaim | undefined;
  getManagedBusiness: (businessId: number) => OwnerManagedBusiness | undefined;
  getEditableData: (businessId: number) => EditableBusinessData | undefined;
  hasUnsavedChanges: (businessId: number, currentData: Partial<EditableBusinessData>) => boolean;
  submitClaim: (businessId: number) => Promise<BusinessClaim>;
  submitBusiness: (
    businessName: string,
    category: BusinessSubmission["category"],
    area: string,
    mediaId?: string,
  ) => Promise<BusinessSubmission>;
  createManagedBusiness: (businessId: number, seedData: Partial<EditableBusinessData>) => Promise<OwnerManagedBusiness>;
  updateManagedBusiness: (businessId: number, updates: Partial<EditableBusinessData>) => Promise<OwnerManagedBusiness | undefined>;
  refreshManagedData: () => Promise<void>;
  availableTags: string[];
  priceRangeOptions: string[];
  categoryOptions: { value: string; label: string }[];
  updateTypeOptions: { value: UpdateType; label: string; icon: string }[];
  getUpdatesByBusiness: (businessId: number) => BusinessUpdate[];
  getUpdateById: (updateId: string) => BusinessUpdate | undefined;
  createUpdate: (update: Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status">) => BusinessUpdate;
  updateExistingUpdate: (updateId: string, updates: Partial<BusinessUpdate>) => BusinessUpdate | undefined;
  deleteExistingUpdate: (updateId: string) => boolean;
  getUpdateTypeLabel: (type: UpdateType) => string;
  getUpdateTypeIcon: (type: UpdateType) => string;
};

const BusinessOwnerContext = createContext<BusinessOwnerContextValue | null>(null);

export function BusinessOwnerProvider({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated } = useCustomer();

  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [rawManagedBusinesses, setRawManagedBusinesses] = useState<Business[]>([]);
  const [managedBusinesses, setManagedBusinesses] = useState<OwnerManagedBusiness[]>([]);
  const [updatesVersion, setUpdatesVersion] = useState(0);

  const refreshManagedData = useCallback(async () => {
    if (!isAuthenticated) {
      setClaims([]);
      setSubmissions([]);
      setRawManagedBusinesses([]);
      setManagedBusinesses([]);
      setReady(true);
      return;
    }

    try {
      const [apiBusinesses, apiClaims, apiSubs] = await Promise.all([
        getManagedBusinesses().catch(() => []),
        getMyClaims().catch(() => []),
        getMySubmissions().catch(() => []),
      ]);

      setRawManagedBusinesses(apiBusinesses);

      // Load operating hours for managed businesses to construct OwnerManagedBusiness
      const mapped = await Promise.all(
        apiBusinesses.map(async (b) => {
          let hours: BusinessHours[] = [];
          try {
            hours = await getBusinessHours(b.id);
          } catch {
            // Hours not yet configured or error loading hours
          }
          return businessToOwnerManaged(b, hours);
        }),
      );

      setManagedBusinesses(mapped);
      setClaims(apiClaims.map(apiClaimToViewModel));
      setSubmissions(apiSubs.map(apiSubmissionToViewModel));
    } catch (err) {
      console.error("Failed to load business owner data from API:", err);
    } finally {
      setReady(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authReady) {
      void refreshManagedData();
    }
  }, [authReady, isAuthenticated, refreshManagedData]);

  // Listener for updates to keep updates feature functioning
  useEffect(() => {
    const handleUpdatesChange = () => setUpdatesVersion((v) => v + 1);
    window.addEventListener("cafnet:updates-updated", handleUpdatesChange);
    return () => {
      window.removeEventListener("cafnet:updates-updated", handleUpdatesChange);
    };
  }, []);

  const isBusinessManaged = useCallback((businessId: number): boolean => {
    return (
      rawManagedBusinesses.some((b) => b.id === businessId) ||
      managedBusinesses.some((mb) => mb.businessId === businessId)
    );
  }, [rawManagedBusinesses, managedBusinesses]);

  const getClaim = useCallback((businessId: number) => {
    return claims.find((c) => c.businessId === businessId);
  }, [claims]);

  const getManagedBusiness = useCallback((businessId: number): OwnerManagedBusiness | undefined => {
    return managedBusinesses.find((b) => b.businessId === businessId);
  }, [managedBusinesses]);

  const getEditableData = useCallback((businessId: number): EditableBusinessData | undefined => {
    const managed = managedBusinesses.find((b) => b.businessId === businessId);
    return managed?.editableData;
  }, [managedBusinesses]);

  const hasUnsavedChanges = useCallback(
    (businessId: number, currentData: Partial<EditableBusinessData>): boolean => {
      const managed = managedBusinesses.find((b) => b.businessId === businessId);
      if (!managed) return false;
      const saved = managed.editableData;

      if (currentData.name !== undefined && currentData.name.trim() !== (saved.name || "").trim()) return true;
      if (currentData.description !== undefined && currentData.description.trim() !== (saved.description || "").trim()) return true;
      if (currentData.phone !== undefined && currentData.phone.trim() !== (saved.phone || "").trim()) return true;
      if (currentData.location !== undefined && currentData.location.trim() !== (saved.location || "").trim()) return true;
      if (currentData.category !== undefined && currentData.category !== saved.category) return true;
      if (currentData.priceRange !== undefined && currentData.priceRange !== saved.priceRange) return true;
      if (currentData.website !== undefined && currentData.website.trim() !== (saved.website || "").trim()) return true;

      if (currentData.tags !== undefined) {
        const currentTags = [...currentData.tags].sort().join(",");
        const savedTags = [...(saved.tags || [])].sort().join(",");
        if (currentTags !== savedTags) return true;
      }

      if (currentData.openingHours !== undefined && saved.openingHours) {
        if (JSON.stringify(currentData.openingHours) !== JSON.stringify(saved.openingHours)) return true;
      }

      return false;
    },
    [managedBusinesses],
  );

  const submitClaim = useCallback(async (businessId: number) => {
    const existing = claims.find((c) => c.businessId === businessId);
    if (existing) return existing;

    const apiClaim = await submitClaimApi(businessId);
    const adapted = apiClaimToViewModel(apiClaim);
    setClaims((prev) => [...prev.filter((c) => c.businessId !== businessId), adapted]);
    return adapted;
  }, [claims]);

  const submitBusiness = useCallback(
    async (
      businessName: string,
      category: BusinessSubmission["category"],
      area: string,
      mediaId?: string,
    ) => {
      const apiSub = await createSubmissionApi({
        business_name: businessName,
        category,
        area,
        media_id: mediaId,
      });
      const adapted = apiSubmissionToViewModel(apiSub);
      setSubmissions((prev) => [...prev, adapted]);
      return adapted;
    },
    [],
  );

  const updateManagedBusiness = useCallback(
    async (
      businessId: number,
      updates: Partial<EditableBusinessData>,
    ): Promise<OwnerManagedBusiness | undefined> => {
      const patchInput = editableDataToUpdateInput(updates);
      const updatedBiz = await updateManagedBusinessApi(businessId, patchInput);

      let updatedHours: BusinessHours[] = [];
      if (updates.openingHours && updates.openingHours.length > 0) {
        const apiHours = openingHoursToBusinessHours(updates.openingHours, businessId);
        await setBusinessHours(businessId, apiHours);
        updatedHours = apiHours;
      } else {
        try {
          updatedHours = await getBusinessHours(businessId);
        } catch {
          // fallback
        }
      }

      const updatedOwnerManaged = businessToOwnerManaged(updatedBiz, updatedHours);

      setRawManagedBusinesses((prev) => {
        const idx = prev.findIndex((b) => b.id === businessId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updatedBiz;
          return next;
        }
        return [...prev, updatedBiz];
      });

      setManagedBusinesses((prev) => {
        const idx = prev.findIndex((b) => b.businessId === businessId);
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = updatedOwnerManaged;
          return next;
        }
        return [...prev, updatedOwnerManaged];
      });

      // Dispatch event to inform any other listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cafnet:managed-businesses-updated"));
      }

      return updatedOwnerManaged;
    },
    [],
  );

  const createManagedBusiness = useCallback(
    async (businessId: number, seedData: Partial<EditableBusinessData>) => {
      const result = await updateManagedBusiness(businessId, seedData);
      if (!result) {
        throw new Error("Unable to save business");
      }
      return result;
    },
    [updateManagedBusiness],
  );

  // Updates & broadcasts management helpers (kept intact for unmigrated updates milestone)
  const getUpdatesByBusiness = useCallback(
    (businessId: number): BusinessUpdate[] => {
      return getUpdatesByBusinessFromStorage(businessId);
    },
    [updatesVersion],
  );

  const getUpdateById = useCallback(
    (updateId: string): BusinessUpdate | undefined => {
      return getUpdateByIdFromStorage(updateId);
    },
    [updatesVersion],
  );

  const createUpdate = useCallback(
    (update: Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status">): BusinessUpdate => {
      const result = createUpdateInStorage(update);
      setUpdatesVersion((v) => v + 1);
      return result;
    },
    [],
  );

  const updateExistingUpdate = useCallback(
    (updateId: string, updates: Partial<BusinessUpdate>): BusinessUpdate | undefined => {
      const result = updateUpdateInStorage(updateId, updates);
      setUpdatesVersion((v) => v + 1);
      return result;
    },
    [],
  );

  const deleteExistingUpdate = useCallback((updateId: string): boolean => {
    const result = deleteUpdateInStorage(updateId);
    setUpdatesVersion((v) => v + 1);
    return result;
  }, []);

  const getUpdateTypeLabel = useCallback((type: UpdateType): string => {
    return getUpdateTypeLabelAdapter(type);
  }, []);

  const getUpdateTypeIcon = useCallback((type: UpdateType): string => {
    return getUpdateTypeIconAdapter(type);
  }, []);

  return (
    <BusinessOwnerContext.Provider
      value={{
        ready,
        claims,
        submissions,
        managedBusinesses,
        rawManagedBusinesses,
        isBusinessManaged,
        getClaim,
        getManagedBusiness,
        getEditableData,
        hasUnsavedChanges,
        submitClaim,
        submitBusiness,
        createManagedBusiness,
        updateManagedBusiness,
        refreshManagedData,
        availableTags,
        priceRangeOptions,
        categoryOptions,
        updateTypeOptions,
        getUpdatesByBusiness,
        getUpdateById,
        createUpdate,
        updateExistingUpdate,
        deleteExistingUpdate,
        getUpdateTypeLabel,
        getUpdateTypeIcon,
      }}
    >
      {children}
    </BusinessOwnerContext.Provider>
  );
}

export function useBusinessOwner() {
  const context = useContext(BusinessOwnerContext);
  if (!context) throw new Error("useBusinessOwner must be used inside BusinessOwnerProvider");
  return context;
}
