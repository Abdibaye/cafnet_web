"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadBusinessOwnerState, saveBusinessOwnerState, type BusinessClaim, type BusinessSubmission } from "@/data/businessOwnerStorage";

type BusinessOwnerContextValue = {
  ready: boolean;
  claims: BusinessClaim[];
  submissions: BusinessSubmission[];
  getClaim: (businessId: number) => BusinessClaim | undefined;
  submitClaim: (businessId: number) => BusinessClaim;
  submitBusiness: (businessName: string, category: BusinessSubmission["category"], area: string) => BusinessSubmission;
};

const BusinessOwnerContext = createContext<BusinessOwnerContextValue | null>(null);

export function BusinessOwnerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [claims, setClaims] = useState<BusinessClaim[]>([]);
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);

  useEffect(() => {
    queueMicrotask(() => {
      const state = loadBusinessOwnerState();
      setClaims(state.claims);
      setSubmissions(state.submissions);
      setReady(true);
    });
  }, []);

  const persist = (nextClaims: BusinessClaim[], nextSubmissions: BusinessSubmission[]) => {
    setClaims(nextClaims);
    setSubmissions(nextSubmissions);
    saveBusinessOwnerState({ claims: nextClaims, submissions: nextSubmissions });
  };

  const submitClaim = (businessId: number) => {
    const existing = claims.find((claim) => claim.businessId === businessId);
    if (existing) return existing;
    const claim: BusinessClaim = { id: `claim-${Date.now()}`, businessId, status: "pending", submittedAt: new Date().toISOString() };
    persist([...claims, claim], submissions);
    return claim;
  };

  const submitBusiness = (businessName: string, category: BusinessSubmission["category"], area: string) => {
    const submission: BusinessSubmission = { id: `submission-${Date.now()}`, businessName, category, area, status: "pending", submittedAt: new Date().toISOString() };
    persist(claims, [...submissions, submission]);
    return submission;
  };

  return <BusinessOwnerContext.Provider value={{ ready, claims, submissions, getClaim: (businessId) => claims.find((claim) => claim.businessId === businessId), submitClaim, submitBusiness }}>{children}</BusinessOwnerContext.Provider>;
}

export function useBusinessOwner() {
  const context = useContext(BusinessOwnerContext);
  if (!context) throw new Error("useBusinessOwner must be used inside BusinessOwnerProvider");
  return context;
}