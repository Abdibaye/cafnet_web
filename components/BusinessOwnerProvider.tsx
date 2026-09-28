"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loadBusinessOwnerState, saveBusinessOwnerState, type BusinessClaim, type BusinessSubmission } from "@/data/businessOwnerStorage";
import { 
  loadOwnerManagedBusinesses, 
  saveOwnerManagedBusinesses, 
  getManagedBusiness as getManagedBusinessFromStorage, 
  getEditableData as getEditableDataFromStorage, 
  createManagedBusiness as createManagedBusinessInStorage, 
  updateManagedBusiness as updateManagedBusinessInStorage, 
  deleteManagedBusiness as deleteManagedBusinessInStorage, 
  hasUnsavedChanges as hasUnsavedChangesInStorage, 
  availableTags, 
  priceRangeOptions, 
  categoryOptions, 
  type OwnerManagedBusiness, 
  type EditableBusinessData 
} from "@/data/ownerManagedBusinessStorage";
import { 
  getUpdatesByBusiness as getUpdatesByBusinessFromStorage, 
  createUpdate as createUpdateInStorage, 
  updateUpdate as updateUpdateInStorage, 
  deleteUpdate as deleteUpdateInStorage, 
  getUpdateById as getUpdateByIdFromStorage, 
  getActiveUpdates, 
  getAllUpdates, 
  getUpdateTypeLabel as getUpdateTypeLabelFromStorage, 
  getUpdateTypeIcon as getUpdateTypeIconFromStorage, 
  updateTypeOptions, 
  type BusinessUpdate, 
  type UpdateType 
} from "@/data/businessUpdateStorage";
import { mockBusinesses } from "@/data/mockBusinesses";

type BusinessOwnerContextValue = {
  ready: boolean;
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
  managedBusinesses: OwnerManagedBusiness[];
  isBusinessManaged: (businessId: number) => boolean;
  getClaim: (businessId: number) => BusinessClaim | undefined;
  getManagedBusiness: (businessId: number) => OwnerManagedBusiness | undefined;
  getEditableData: (businessId: number) => EditableBusinessData | undefined;
  hasUnsavedChanges: (businessId: number, currentData: Partial<EditableBusinessData>) => boolean;
  submitClaim: (businessId: number) => BusinessClaim;
  submitBusiness: (businessName: string, category: BusinessSubmission["category"], area: string) => BusinessSubmission;
  createManagedBusiness: (businessId: number, seedData: Partial<EditableBusinessData>) => OwnerManagedBusiness;
  updateManagedBusiness: (businessId: number, updates: Partial<EditableBusinessData>) => OwnerManagedBusiness | undefined;
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
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [managedBusinesses, setManagedBusinesses] = useState<OwnerManagedBusiness[]>([]);
  const [updatesVersion, setUpdatesVersion] = useState(0);
  const [menuVersion, setMenuVersion] = useState(0);

  const refreshState = useCallback(() => {
    const ownerState = loadBusinessOwnerState();
    const managedState = loadOwnerManagedBusinesses();
    setClaims(ownerState.claims);
    setSubmissions(ownerState.submissions);
    setManagedBusinesses(managedState.managedBusinesses);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshState();
      setReady(true);
    });

    const handleOwnerUpdate = () => refreshState();
    const handleManagedUpdate = () => refreshState();
    const handleUpdatesChange = () => setUpdatesVersion((v) => v + 1);

    const handleMenuChange = () => {
      setMenuVersion((v) => v + 1);
    };

    window.addEventListener("cafnet:business-owner-updated", handleOwnerUpdate);
    window.addEventListener("cafnet:managed-businesses-updated", handleManagedUpdate);
    window.addEventListener("cafnet:updates-updated", handleUpdatesChange);
    window.addEventListener("cafnet:menu-updated", handleMenuChange);

    return () => {
      window.removeEventListener("cafnet:business-owner-updated", handleOwnerUpdate);
      window.removeEventListener("cafnet:managed-businesses-updated", handleManagedUpdate);
      window.removeEventListener("cafnet:updates-updated", handleUpdatesChange);
      window.removeEventListener("cafnet:menu-updated", handleMenuChange);
    };
  }, [refreshState]);

  const isBusinessManaged = useCallback((businessId: number): boolean => {
    const isMockClaimed = mockBusinesses.some((b) => b.id === businessId && b.claimStatus === "claimed");
    if (isMockClaimed) return true;
    return managedBusinesses.some((mb) => mb.businessId === businessId);
  }, [managedBusinesses]);

  const getUpdatesByBusiness = useCallback((businessId: number): BusinessUpdate[] => {
    return getUpdatesByBusinessFromStorage(businessId);
  }, [updatesVersion]);

  const getUpdateById = useCallback((updateId: string): BusinessUpdate | undefined => {
    return getUpdateByIdFromStorage(updateId);
  }, [updatesVersion]);

  const createUpdate = useCallback((update: Omit<BusinessUpdate, "id" | "createdAt" | "publishedAt" | "status">): BusinessUpdate => {
    const result = createUpdateInStorage(update);
    setUpdatesVersion((v) => v + 1);
    return result;
  }, []);

  const updateExistingUpdate = useCallback((updateId: string, updates: Partial<BusinessUpdate>): BusinessUpdate | undefined => {
    const result = updateUpdateInStorage(updateId, updates);
    setUpdatesVersion((v) => v + 1);
    return result;
  }, []);

  const deleteExistingUpdate = useCallback((updateId: string): boolean => {
    const result = deleteUpdateInStorage(updateId);
    setUpdatesVersion((v) => v + 1);
    return result;
  }, []);

  const getUpdateTypeLabel = useCallback((type: UpdateType): string => {
    return getUpdateTypeLabelFromStorage(type);
  }, []);

  const getUpdateTypeIcon = useCallback((type: UpdateType): string => {
    return getUpdateTypeIconFromStorage(type);
  }, []);

  const persistOwnerState = useCallback((nextClaims: BusinessClaim[], nextSubmissions: BusinessSubmission[]) => {
    setClaims(nextClaims);
    setSubmissions(nextSubmissions);
    saveBusinessOwnerState({ claims: nextClaims, submissions: nextSubmissions });
  }, []);

  const persistManagedState = useCallback((nextManagedBusinesses: OwnerManagedBusiness[]) => {
    setManagedBusinesses(nextManagedBusinesses);
    saveOwnerManagedBusinesses({ managedBusinesses: nextManagedBusinesses });
  }, []);

  const submitClaim = useCallback((businessId: number) => {
    const existing = claims.find((claim) => claim.businessId === businessId);
    if (existing) return existing;
    const claim: BusinessClaim = { id: `claim-${Date.now()}`, businessId, status: "pending", submittedAt: new Date().toISOString() };
    const nextClaims = [...claims, claim];
    persistOwnerState(nextClaims, submissions);
    return claim;
  }, [claims, submissions, persistOwnerState]);

  const submitBusiness = useCallback((businessName: string, category: BusinessSubmission["category"], area: string) => {
    const submission: BusinessSubmission = { id: `submission-${Date.now()}`, businessName, category, area, status: "pending", submittedAt: new Date().toISOString() };
    const nextSubmissions = [...submissions, submission];
    persistOwnerState(claims, nextSubmissions);
    return submission;
  }, [claims, submissions, persistOwnerState]);

  const createManagedBusiness = useCallback((businessId: number, seedData: Partial<EditableBusinessData>) => {
    const managedBusiness = createManagedBusinessInStorage(businessId, seedData);
    const updatedList = [...managedBusinesses.filter((b) => b.businessId !== businessId), managedBusiness];
    persistManagedState(updatedList);
    return managedBusiness;
  }, [managedBusinesses, persistManagedState]);

  const updateManagedBusiness = useCallback((businessId: number, updates: Partial<EditableBusinessData>) => {
    const updated = updateManagedBusinessInStorage(businessId, updates);
    if (updated) {
      const index = managedBusinesses.findIndex((b) => b.businessId === businessId);
      if (index !== -1) {
        const newManagedBusinesses = [...managedBusinesses];
        newManagedBusinesses[index] = updated;
        persistManagedState(newManagedBusinesses);
      } else {
        persistManagedState([...managedBusinesses, updated]);
      }
    }
    return updated;
  }, [managedBusinesses, persistManagedState]);

  const getManagedBusiness = useCallback((businessId: number): OwnerManagedBusiness | undefined => {
    return managedBusinesses.find((b) => b.businessId === businessId) || getManagedBusinessFromStorage(businessId);
  }, [managedBusinesses]);

  const getEditableData = useCallback((businessId: number): EditableBusinessData | undefined => {
    const managed = managedBusinesses.find((b) => b.businessId === businessId);
    if (managed) return managed.editableData;
    return getEditableDataFromStorage(businessId);
  }, [managedBusinesses]);

  const hasUnsavedChanges = useCallback((businessId: number, currentData: Partial<EditableBusinessData>): boolean => {
    return hasUnsavedChangesInStorage(businessId, currentData);
  }, []);

  return (
    <BusinessOwnerContext.Provider value={{
      ready,
      claims,
      submissions,
      managedBusinesses,
      isBusinessManaged,
      getClaim: (businessId) => claims.find((claim) => claim.businessId === businessId),
      getManagedBusiness,
      getEditableData,
      hasUnsavedChanges,
      submitClaim,
      submitBusiness,
      createManagedBusiness,
      updateManagedBusiness,
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
    }}>
      {children}
    </BusinessOwnerContext.Provider>
  );
}

export function useBusinessOwner() {
  const context = useContext(BusinessOwnerContext);
  if (!context) throw new Error("useBusinessOwner must be used inside BusinessOwnerProvider");
  return context;
}
