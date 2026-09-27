"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { loadMockCustomer, saveMockCustomer } from "@/data/customerStorage";

export type MockCustomer = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  savedBusinessIds: number[];
  followedBusinessIds: number[];
};

type CustomerAction = "save" | "follow";
type AuthStep = "prompt" | "phone" | "otp" | null;
type CustomerContextValue = {
  currentUser: MockCustomer | null;
  authReady: boolean;
  authStep: AuthStep;
  authError: string;
  authPhone: string;
  pendingAction: { type: CustomerAction; businessId: number } | null;
  isAuthenticated: boolean;
  isSaved: (businessId: number) => boolean;
  isFollowing: (businessId: number) => boolean;
  requestAction: (type: CustomerAction, businessId: number) => void;
  closeAuth: () => void;
  continueToPhone: () => void;
  setAuthPhone: (phone: string) => void;
  submitPhone: () => void;
  verifyOtp: (code: string) => void;
  saveBusiness: (businessId: number) => void;
  unsaveBusiness: (businessId: number) => void;
  followBusiness: (businessId: number) => void;
  unfollowBusiness: (businessId: number) => void;
  logout: () => void;
  startSignIn: () => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

const mockCustomer: MockCustomer = {
  id: "mock-customer-abdi",
  name: "Abdi",
  phone: "+251 9XX XXX XXX",
  avatar: "A",
  savedBusinessIds: [],
  followedBusinessIds: [],
};

function updateIds(ids: number[], businessId: number, shouldInclude: boolean) {
  return shouldInclude ? Array.from(new Set([...ids, businessId])) : ids.filter((id) => id !== businessId);
}

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<MockCustomer | null>(null);
  const [storedCustomer, setStoredCustomer] = useState<MockCustomer>(mockCustomer);
  const [authReady, setAuthReady] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>(null);
  const [authError, setAuthError] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [pendingAction, setPendingAction] = useState<CustomerContextValue["pendingAction"]>(null);

  useEffect(() => {
    queueMicrotask(() => {
      const savedCustomer = loadMockCustomer();
      if (savedCustomer) {
        setStoredCustomer(savedCustomer);
        setCurrentUser(savedCustomer);
      }
      setAuthReady(true);
    });
  }, []);

  const persistCustomer = (customer: MockCustomer) => {
    setStoredCustomer(customer);
    setCurrentUser(customer);
    saveMockCustomer(customer);
  };

  const changeBusinessState = (type: CustomerAction, businessId: number, shouldInclude: boolean, sourceCustomer = currentUser) => {
    if (!sourceCustomer) return;
    const customer = {
      ...sourceCustomer,
      savedBusinessIds: type === "save" ? updateIds(sourceCustomer.savedBusinessIds, businessId, shouldInclude) : sourceCustomer.savedBusinessIds,
      followedBusinessIds: type === "follow" ? updateIds(sourceCustomer.followedBusinessIds, businessId, shouldInclude) : sourceCustomer.followedBusinessIds,
    };
    persistCustomer(customer);
  };

  const requestAction = (type: CustomerAction, businessId: number) => {
    if (currentUser) {
      const isActive = type === "save" ? currentUser.savedBusinessIds.includes(businessId) : currentUser.followedBusinessIds.includes(businessId);
      changeBusinessState(type, businessId, !isActive);
      return;
    }
    setPendingAction({ type, businessId });
    setAuthError("");
    setAuthStep("prompt");
  };

  const continueToPhone = () => {
    setAuthError("");
    setAuthStep("phone");
  };

  const submitPhone = () => {
    const digits = authPhone.replace(/[\s()-]/g, "");
    if (!/^(?:\+2519\d{8}|09\d{8}|9\d{8})$/.test(digits)) {
      setAuthError("Enter a valid Ethiopian phone number.");
      return;
    }
    setAuthError("");
    setAuthStep("otp");
  };

  const verifyOtp = (code: string) => {
    if (code !== "123456") {
      setAuthError("Incorrect code. Please check the code and try again.");
      return;
    }
    const customer = { ...storedCustomer, phone: authPhone };
    if (pendingAction) {
      const updatedCustomer = {
        ...customer,
        savedBusinessIds: pendingAction.type === "save" ? updateIds(customer.savedBusinessIds, pendingAction.businessId, true) : customer.savedBusinessIds,
        followedBusinessIds: pendingAction.type === "follow" ? updateIds(customer.followedBusinessIds, pendingAction.businessId, true) : customer.followedBusinessIds,
      };
      persistCustomer(updatedCustomer);
    } else {
      persistCustomer(customer);
    }
    setPendingAction(null);
    setAuthError("");
    setAuthStep(null);
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthStep(null);
    setPendingAction(null);
  };

  const startSignIn = () => {
    setPendingAction(null);
    setAuthError("");
    setAuthStep("phone");
  };

  const value: CustomerContextValue = {
    currentUser,
    authReady,
    authStep,
    authError,
    authPhone,
    pendingAction,
    isAuthenticated: Boolean(currentUser),
    isSaved: (businessId) => Boolean(currentUser?.savedBusinessIds.includes(businessId)),
    isFollowing: (businessId) => Boolean(currentUser?.followedBusinessIds.includes(businessId)),
    requestAction,
    closeAuth: () => { setAuthStep(null); setPendingAction(null); setAuthError(""); },
    continueToPhone,
    setAuthPhone,
    submitPhone,
    verifyOtp,
    saveBusiness: (businessId) => changeBusinessState("save", businessId, true),
    unsaveBusiness: (businessId) => changeBusinessState("save", businessId, false),
    followBusiness: (businessId) => changeBusinessState("follow", businessId, true),
    unfollowBusiness: (businessId) => changeBusinessState("follow", businessId, false),
    logout,
    startSignIn,
  };

  return <CustomerContext.Provider value={value}>{children}<MockAuthFlow /></CustomerContext.Provider>;
}

function MockAuthFlow() {
  const customer = useCustomer();
  if (!customer.authStep) return null;

  if (customer.authStep === "prompt") {
    const noun = customer.pendingAction?.type === "follow" ? "your favorite places" : "places you love";
    return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-on-surface/30 p-4 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) customer.closeAuth(); }}><section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(20,33,61,0.18)]" role="dialog" aria-modal="true" aria-labelledby="account-prompt-title"><div className="flex items-start justify-between gap-4"><div><h2 id="account-prompt-title" className="text-xl font-bold text-on-surface">Save {noun}.</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Create a free Cafnet account to keep {noun} in one place.</p></div><button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low" aria-label="Close account prompt" onClick={customer.closeAuth}><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div><button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={customer.continueToPhone}>Continue with phone</button><button type="button" className="mt-2 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low" onClick={customer.closeAuth}>Not now</button></section></div>;
  }

  const isOtp = customer.authStep === "otp";
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-5"><section className="w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="auth-flow-title"><button type="button" className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary" onClick={customer.closeAuth}><span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_back</span>Back</button><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Cafnet account</p><h2 id="auth-flow-title" className="mt-2 text-3xl font-bold text-on-surface">{isOtp ? "Enter your code" : "Sign in to Cafnet"}</h2><p className="mt-3 text-sm leading-6 text-on-surface-variant">{isOtp ? "Enter the 6-digit code sent to your phone." : "Save places and follow businesses you care about."}</p>{isOtp ? <><label htmlFor="mock-otp" className="mt-8 block text-sm font-semibold text-on-surface">Verification code</label><input id="mock-otp" className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-center text-lg tracking-[0.35em] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" inputMode="numeric" maxLength={6} placeholder="123456" onChange={(event) => { if (event.target.value.length === 6) customer.verifyOtp(event.target.value); }} autoFocus /><p className="mt-3 text-xs text-on-surface-variant">Development code: 123456</p></> : <><label htmlFor="mock-phone" className="mt-8 block text-sm font-semibold text-on-surface">Phone number</label><input id="mock-phone" className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" type="tel" inputMode="tel" placeholder="+251 9__ ___ ____" value={customer.authPhone} onChange={(event) => customer.setAuthPhone(event.target.value)} autoFocus /><button type="button" className="mt-4 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={customer.submitPhone}>Continue</button></>}{customer.authError && <p className="mt-3 text-sm font-semibold text-secondary" role="alert">{customer.authError}</p>}</section></div>;
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerProvider");
  return context;
}