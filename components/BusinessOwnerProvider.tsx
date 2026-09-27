"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loadBusinessOwnerState, saveBusinessOwnerState, type BusinessClaim, type BusinessSubmission } from "@/data/businessOwnerStorage";
import { loadOwnerManagedBusinesses, saveOwnerManagedBusinesses, createManagedBusiness as createManagedBusinessInStorage, updateManagedBusiness as updateManagedBusinessInStorage, getManagedBusiness as getManagedBusinessFromStorage, getEditableData as getEditableDataFromStorage, deleteManagedBusiness, hasUnsavedChanges as hasUnsavedChangesInStorage, type OwnerManagedBusiness, type EditableBusinessData, type OpeningHours, availableTags, priceRangeOptions, categoryOptions } from "@/data/ownerManagedBusinessStorage";

type BusinessOwnerContextValue = {
  ready: boolean;
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
  managedBusinesses: OwnerManagedBusiness[];
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
};

const BusinessOwnerContext = createContext<BusinessOwnerContextValue | null>(null);

export function BusinessOwnerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [managedBusinesses, setManagedBusinesses] = useState<OwnerManagedBusiness[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      const ownerState = loadBusinessOwnerState();
      const managedState = loadOwnerManagedBusinesses();
      setClaims(ownerState.claims);
      setSubmissions(ownerState.submissions);
      setManagedBusinesses(managedState.managedBusinesses);
      setReady(true);
    });
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
    persistOwnerState([...claims, claim], submissions);
    return claim;
  }, [claims, submissions, persistOwnerState]);

  const submitBusiness = useCallback((businessName: string, category: BusinessSubmission["category"], area: string) => {
    const submission: BusinessSubmission = { id: `submission-${Date.now()}`, businessName, category, area, status: "pending", submittedAt: new Date().toISOString() };
    persistOwnerState(claims, [...submissions, submission]);
    return submission;
  }, [claims, submissions, persistOwnerState]);

  const createManagedBusiness = useCallback((businessId: number, seedData: Partial<EditableBusinessData>) => {
    const managedBusiness = createManagedBusinessInStorage(businessId, seedData);
    persistManagedState([...managedBusinesses, managedBusiness]);
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
      }
    }
    return updated;
  }, [managedBusinesses, persistManagedState]);

  const getManagedBusiness = useCallback((businessId: number): OwnerManagedBusiness | undefined => {
    return getManagedBusinessFromStorage(businessId) || managedBusinesses.find((b) => b.businessId === businessId);
  }, [managedBusinesses]);

  const getEditableData = useCallback((businessId: number): EditableBusinessData | undefined => {
    return getEditableDataFromStorage(businessId);
  }, []);

  const hasUnsavedChanges = useCallback((businessId: number, currentData: Partial<EditableBusinessData>): boolean => {
    return hasUnsavedChangesInStorage(businessId, currentData);
  }, []);

  return (
    <BusinessOwnerContext.Provider value={{
      ready,
      claims,
      submissions,
      managedBusinesses,
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