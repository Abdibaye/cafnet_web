"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadMockCustomer, saveMockCustomer } from "@/data/customerStorage";

export type MockCustomer = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  savedBusinessIds: number[];
  followedBusinessIds: number[];
};

export type CustomerAction = "save" | "follow";
export type AuthStep = "prompt" | "phone" | "otp" | null;

export type AuthIntent = 
  | { type: CustomerAction; businessId: number }
  | { type: "callback"; callback: () => void }
  | { type: "redirect"; url: string };

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
  requestAuth: (options?: { intent?: AuthIntent; callback?: () => void; redirectUrl?: string }) => void;
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
  toast: string;
  showToast: (message: string) => void;
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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<MockCustomer | null>(null);
  const [storedCustomer, setStoredCustomer] = useState<MockCustomer>(mockCustomer);
  const [authReady, setAuthReady] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>(null);
  const [authError, setAuthError] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [pendingIntent, setPendingIntent] = useState<AuthIntent | null>(null);
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToast("");
    }, 2800);
  }, []);

  const refreshCustomer = useCallback(() => {
    const savedCustomer = loadMockCustomer();
    if (savedCustomer) {
      setStoredCustomer(savedCustomer);
      setCurrentUser(savedCustomer);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refreshCustomer();
      setAuthReady(true);
    });

    const handleUpdate = () => refreshCustomer();
    window.addEventListener("cafnet:customer-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:customer-updated", handleUpdate);
  }, [refreshCustomer]);

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
    if (type === "save") {
      showToast(shouldInclude ? "Saved to your places" : "Removed from saved places");
    } else {
      showToast(shouldInclude ? "Following updates" : "Unfollowed");
    }
  };

  const requestAction = (type: CustomerAction, businessId: number) => {
    if (currentUser) {
      const isActive = type === "save" ? currentUser.savedBusinessIds.includes(businessId) : currentUser.followedBusinessIds.includes(businessId);
      changeBusinessState(type, businessId, !isActive);
      return;
    }
    setPendingIntent({ type, businessId });
    setAuthError("");
    setAuthStep("prompt");
  };

  const requestAuth = (options?: { intent?: AuthIntent; callback?: () => void; redirectUrl?: string }) => {
    if (currentUser) {
      if (options?.callback) options.callback();
      else if (options?.redirectUrl) router.push(options.redirectUrl);
      return;
    }
    if (options?.callback) {
      setPendingIntent({ type: "callback", callback: options.callback });
    } else if (options?.redirectUrl) {
      setPendingIntent({ type: "redirect", url: options.redirectUrl });
    } else if (options?.intent) {
      setPendingIntent(options.intent);
    } else {
      setPendingIntent(null);
    }
    setAuthError("");
    setAuthStep("phone");
  };

  const continueToPhone = () => {
    setAuthError("");
    setAuthStep("phone");
  };

  const submitPhone = () => {
    const digits = authPhone.replace(/[\s()-]/g, "");
    if (!/^(?:\+2519\d{8}|09\d{8}|9\d{8})$/.test(digits)) {
      setAuthError("Enter a valid Ethiopian phone number (e.g. +251 9XX XXX XXX or 09XX XXX XXX).");
      return;
    }
    setAuthError("");
    setAuthStep("otp");
  };

  const verifyOtp = (code: string) => {
    if (code !== "123456") {
      setAuthError("Incorrect code. Please enter 123456.");
      return;
    }
    const customer = { ...storedCustomer, phone: authPhone || storedCustomer.phone };
    
    if (pendingIntent) {
      if (pendingIntent.type === "save" || pendingIntent.type === "follow") {
        const updatedCustomer = {
          ...customer,
          savedBusinessIds: pendingIntent.type === "save" ? updateIds(customer.savedBusinessIds, pendingIntent.businessId, true) : customer.savedBusinessIds,
          followedBusinessIds: pendingIntent.type === "follow" ? updateIds(customer.followedBusinessIds, pendingIntent.businessId, true) : customer.followedBusinessIds,
        };
        persistCustomer(updatedCustomer);
        showToast(pendingIntent.type === "save" ? "Saved to your places" : "Following updates");
      } else {
        persistCustomer(customer);
        if (pendingIntent.type === "callback") {
          pendingIntent.callback();
        } else if (pendingIntent.type === "redirect") {
          router.push(pendingIntent.url);
        }
      }
    } else {
      persistCustomer(customer);
    }

    setPendingIntent(null);
    setAuthError("");
    setAuthStep(null);
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthStep(null);
    setPendingIntent(null);
    showToast("Signed out");
  };

  const startSignIn = () => {
    setPendingIntent(null);
    setAuthError("");
    setAuthStep("phone");
  };

  const pendingActionLegacy = pendingIntent && (pendingIntent.type === "save" || pendingIntent.type === "follow")
    ? { type: pendingIntent.type, businessId: pendingIntent.businessId }
    : null;

  const value: CustomerContextValue = {
    currentUser,
    authReady,
    authStep,
    authError,
    authPhone,
    pendingAction: pendingActionLegacy,
    isAuthenticated: Boolean(currentUser),
    isSaved: (businessId) => Boolean(currentUser?.savedBusinessIds.includes(businessId)),
    isFollowing: (businessId) => Boolean(currentUser?.followedBusinessIds.includes(businessId)),
    requestAction,
    requestAuth,
    closeAuth: () => { setAuthStep(null); setPendingIntent(null); setAuthError(""); },
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
    toast,
    showToast,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
      <MockAuthFlow />
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-[80] -translate-x-1/2 rounded-xl bg-on-surface px-5 py-3 text-sm font-semibold text-white shadow-xl md:bottom-8 transition-all animate-in fade-in slide-in-from-bottom-2"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </CustomerContext.Provider>
  );
}

function MockAuthFlow() {
  const customer = useCustomer();
  const [isVerifying, setIsVerifying] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!customer.authStep) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") customer.closeAuth();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customer.authStep, customer]);

  if (!customer.authStep) return null;

  if (customer.authStep === "prompt") {
    const noun = customer.pendingAction?.type === "follow" ? "your favorite places" : "places you love";
    return (
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-on-surface/40 p-4 backdrop-blur-xs sm:items-center"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) customer.closeAuth();
        }}
      >
        <section
          ref={dialogRef}
          className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(20,33,61,0.18)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-prompt-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="account-prompt-title" className="text-xl font-bold text-on-surface">
                Save {noun}.
              </h2>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Create a free Cafnet account to keep {noun} in one place.
              </p>
            </div>
            <button
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary"
              aria-label="Close account prompt"
              onClick={customer.closeAuth}
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          </div>
          <button
            type="button"
            className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            onClick={customer.continueToPhone}
          >
            Continue with phone
          </button>
          <button
            type="button"
            className="mt-2 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            onClick={customer.closeAuth}
          >
            Not now
          </button>
        </section>
      </div>
    );
  }

  const isOtp = customer.authStep === "otp";

  const handleOtpInput = (value: string) => {
    if (value.length === 6 && !isVerifying) {
      setIsVerifying(true);
      customer.verifyOtp(value);
      setTimeout(() => setIsVerifying(false), 500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-xs p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) customer.closeAuth();
      }}
    >
      <section
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-white p-6 sm:p-8 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-flow-title"
      >
        <button
          type="button"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          onClick={customer.closeAuth}
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">arrow_back</span>
          Back
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Cafnet account
        </p>
        <h2 id="auth-flow-title" className="mt-2 text-2xl sm:text-3xl font-bold text-on-surface">
          {isOtp ? "Enter your code" : "Sign in to Cafnet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {isOtp
            ? "Enter the 6-digit code sent to your phone."
            : "Save places, follow kitchens, and manage your reservations."}
        </p>

        {isOtp ? (
          <>
            <label htmlFor="mock-otp" className="mt-7 block text-sm font-semibold text-on-surface">
              Verification code
            </label>
            <input
              id="mock-otp"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-center text-lg tracking-[0.35em] font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              onChange={(event) => handleOtpInput(event.target.value)}
              autoFocus
              disabled={isVerifying}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Code for testing: <strong>123456</strong></span>
              <button
                type="button"
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={customer.continueToPhone}
              >
                Change number
              </button>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="mock-phone" className="mt-7 block text-sm font-semibold text-on-surface">
              Ethiopian phone number
            </label>
            <input
              id="mock-phone"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              type="tel"
              inputMode="tel"
              placeholder="+251 9XX XXX XXX or 09XX XXX XXX"
              value={customer.authPhone}
              onChange={(event) => customer.setAuthPhone(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") customer.submitPhone();
              }}
              autoFocus
            />
            <button
              type="button"
              className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              onClick={customer.submitPhone}
            >
              Continue with code
            </button>
          </>
        )}

        {customer.authError && (
          <p className="mt-4 rounded-lg bg-secondary-container/40 p-3 text-sm font-semibold text-secondary" role="alert">
            {customer.authError}
          </p>
        )}
      </section>
    </div>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerProvider");
  return context;
}
