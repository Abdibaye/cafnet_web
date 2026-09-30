"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import * as authApi from "@/lib/api/auth";
import * as customerApi from "@/lib/api/customer";
import { ApiError } from "@/lib/api/errors";
import type { User } from "@/lib/api/types";

export type MockCustomer = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  role?: string;
  profileCompleted: boolean;
  savedBusinessIds: number[];
  followedBusinessIds: number[];
};

export type CustomerUser = MockCustomer;

export type CustomerAction = "save" | "follow";
export type AuthStep = "prompt" | "phone" | "otp" | "onboarding" | null;

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
  devOtp: string;
  isSubmitting: boolean;
  pendingAction: { type: CustomerAction; businessId: number } | null;
  isAuthenticated: boolean;
  isSaved: (businessId: number) => boolean;
  isFollowing: (businessId: number) => boolean;
  requestAction: (type: CustomerAction, businessId: number) => void;
  requestAuth: (options?: {
    intent?: AuthIntent;
    callback?: () => void;
    redirectUrl?: string;
  }) => void;
  closeAuth: () => void;
  continueToPhone: () => void;
  setAuthPhone: (phone: string) => void;
  submitPhone: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  updateProfile: (fullName: string, avatarUrl?: string) => Promise<User>;
  skipOnboarding: () => void;
  saveBusiness: (businessId: number) => Promise<void>;
  unsaveBusiness: (businessId: number) => Promise<void>;
  followBusiness: (businessId: number) => Promise<void>;
  unfollowBusiness: (businessId: number) => Promise<void>;
  logout: () => Promise<void>;
  startSignIn: () => void;
  toast: string;
  showToast: (message: string) => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s()\-.]/g, "");
  if (digits.startsWith("+251")) {
    return digits;
  }
  if (digits.startsWith("251")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+251${digits.slice(1)}`;
  }
  if ((digits.startsWith("9") || digits.startsWith("7")) && digits.length === 9) {
    return `+251${digits}`;
  }
  return digits;
}

function mapUserToCustomer(
  user: User,
  savedIds: number[],
  followedIds: number[],
): MockCustomer {
  const name = user.full_name && user.full_name !== "" ? user.full_name : "Customer";
  const avatar = name.charAt(0).toUpperCase() || "C";
  const profileCompleted = typeof user.profile_completed === "boolean"
    ? user.profile_completed
    : Boolean(user.full_name && !user.full_name.startsWith("Customer "));
  return {
    id: user.id,
    name,
    phone: user.phone,
    avatar,
    role: user.role,
    profileCompleted,
    savedBusinessIds: savedIds,
    followedBusinessIds: followedIds,
  };
}

export function CustomerProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<MockCustomer | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [followedIds, setFollowedIds] = useState<number[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>(null);
  const [authError, setAuthError] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const refreshCustomerState = useCallback(async () => {
    try {
      const user = await authApi.getCurrentUser();
      if (user) {
        const [savedList, followedList] = await Promise.all([
          customerApi.getSavedBusinesses().catch(() => []),
          customerApi.getFollowedBusinesses().catch(() => []),
        ]);
        const s = savedList.map((b) => b.id);
        const f = followedList.map((b) => b.id);
        setSavedIds(s);
        setFollowedIds(f);
        setCurrentUser(mapUserToCustomer(user, s, f));
      } else {
        setCurrentUser(null);
        setSavedIds([]);
        setFollowedIds([]);
      }
    } catch {
      setCurrentUser(null);
      setSavedIds([]);
      setFollowedIds([]);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    refreshCustomerState();

    const handleUpdate = () => {
      if (!cancelled) refreshCustomerState();
    };
    window.addEventListener("cafnet:customer-updated", handleUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("cafnet:customer-updated", handleUpdate);
    };
  }, [refreshCustomerState]);

  const saveBusiness = useCallback(
    async (businessId: number) => {
      if (!currentUser) return;
      const prev = savedIds;
      const next = Array.from(new Set([...prev, businessId]));
      setSavedIds(next);
      setCurrentUser((u) => (u ? { ...u, savedBusinessIds: next } : null));
      showToast("Saved to your places");

      try {
        await customerApi.saveBusiness(businessId);
      } catch (err) {
        // Rollback
        setSavedIds(prev);
        setCurrentUser((u) => (u ? { ...u, savedBusinessIds: prev } : null));
        const msg = err instanceof ApiError ? err.message : "Failed to save place";
        showToast(msg);
      }
    },
    [currentUser, savedIds, showToast],
  );

  const unsaveBusiness = useCallback(
    async (businessId: number) => {
      if (!currentUser) return;
      const prev = savedIds;
      const next = prev.filter((id) => id !== businessId);
      setSavedIds(next);
      setCurrentUser((u) => (u ? { ...u, savedBusinessIds: next } : null));
      showToast("Removed from saved places");

      try {
        await customerApi.unsaveBusiness(businessId);
      } catch (err) {
        // Rollback
        setSavedIds(prev);
        setCurrentUser((u) => (u ? { ...u, savedBusinessIds: prev } : null));
        const msg = err instanceof ApiError ? err.message : "Failed to remove place";
        showToast(msg);
      }
    },
    [currentUser, savedIds, showToast],
  );

  const followBusiness = useCallback(
    async (businessId: number) => {
      if (!currentUser) return;
      const prev = followedIds;
      const next = Array.from(new Set([...prev, businessId]));
      setFollowedIds(next);
      setCurrentUser((u) => (u ? { ...u, followedBusinessIds: next } : null));
      showToast("Following updates");

      try {
        await customerApi.followBusiness(businessId);
      } catch (err) {
        // Rollback
        setFollowedIds(prev);
        setCurrentUser((u) => (u ? { ...u, followedBusinessIds: prev } : null));
        const msg = err instanceof ApiError ? err.message : "Failed to follow place";
        showToast(msg);
      }
    },
    [currentUser, followedIds, showToast],
  );

  const unfollowBusiness = useCallback(
    async (businessId: number) => {
      if (!currentUser) return;
      const prev = followedIds;
      const next = prev.filter((id) => id !== businessId);
      setFollowedIds(next);
      setCurrentUser((u) => (u ? { ...u, followedBusinessIds: next } : null));
      showToast("Unfollowed");

      try {
        await customerApi.unfollowBusiness(businessId);
      } catch (err) {
        // Rollback
        setFollowedIds(prev);
        setCurrentUser((u) => (u ? { ...u, followedBusinessIds: prev } : null));
        const msg = err instanceof ApiError ? err.message : "Failed to unfollow place";
        showToast(msg);
      }
    },
    [currentUser, followedIds, showToast],
  );

  const requestAction = useCallback(
    (type: CustomerAction, businessId: number) => {
      if (currentUser) {
        if (type === "save") {
          const isCurrentlySaved = savedIds.includes(businessId);
          if (isCurrentlySaved) unsaveBusiness(businessId);
          else saveBusiness(businessId);
        } else {
          const isCurrentlyFollowed = followedIds.includes(businessId);
          if (isCurrentlyFollowed) unfollowBusiness(businessId);
          else followBusiness(businessId);
        }
        return;
      }
      setPendingIntent({ type, businessId });
      setAuthError("");
      setAuthStep("prompt");
    },
    [currentUser, savedIds, followedIds, saveBusiness, unsaveBusiness, followBusiness, unfollowBusiness],
  );

  const requestAuth = useCallback(
    (options?: {
      intent?: AuthIntent;
      callback?: () => void;
      redirectUrl?: string;
    }) => {
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
    },
    [currentUser, router],
  );

  const continueToPhone = useCallback(() => {
    setAuthError("");
    setAuthStep("phone");
  }, []);

  const submitPhone = useCallback(async () => {
    const formattedPhone = normalizePhone(authPhone);
    if (!/^\+251[97]\d{8}$/.test(formattedPhone)) {
      setAuthError("Enter a valid Ethiopian phone number (e.g. +251 9XX XXX XXX, +251 7XX XXX XXX or 09/07XX XXX XXX).");
      return;
    }

    setAuthError("");
    setIsSubmitting(true);
    try {
      const res = await authApi.requestOtp(formattedPhone);
      setChallengeId(res.challenge_id);
      setDevOtp(res.dev_otp || "");
      setAuthStep("otp");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError("Failed to send verification code. Please check your connection.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [authPhone]);

  const finalizeAuthSuccess = useCallback(
    async (userDisplayName: string) => {
      setAuthStep(null);
      setDevOtp("");
      if (pendingIntent) {
        if (pendingIntent.type === "save") {
          try {
            await customerApi.saveBusiness(pendingIntent.businessId);
            setSavedIds((prev) => Array.from(new Set([...prev, pendingIntent.businessId])));
            showToast("Saved to your places");
          } catch {
            showToast("Signed in, but failed to save place");
          }
        } else if (pendingIntent.type === "follow") {
          try {
            await customerApi.followBusiness(pendingIntent.businessId);
            setFollowedIds((prev) => Array.from(new Set([...prev, pendingIntent.businessId])));
            showToast("Following updates");
          } catch {
            showToast("Signed in, but failed to follow");
          }
        } else if (pendingIntent.type === "callback") {
          pendingIntent.callback();
        } else if (pendingIntent.type === "redirect") {
          router.push(pendingIntent.url);
        }
        setPendingIntent(null);
      } else {
        showToast(`Welcome to Cafnet, ${userDisplayName}!`);
      }
    },
    [pendingIntent, router, showToast],
  );

  const updateProfile = useCallback(
    async (fullName: string, avatarUrl?: string): Promise<User> => {
      const trimmed = fullName.trim();
      if (!trimmed || trimmed.length < 2) {
        const msg = "Full name must be at least 2 characters.";
        setAuthError(msg);
        throw new Error(msg);
      }
      setIsSubmitting(true);
      setAuthError("");
      try {
        const updated = await authApi.updateProfile({
          full_name: trimmed,
          avatar_url: avatarUrl,
        });

        setCurrentUser((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            name: updated.full_name,
            avatar: updated.full_name.charAt(0).toUpperCase() || prev.avatar,
            profileCompleted: true,
          };
        });

        if (authStep === "onboarding") {
          await finalizeAuthSuccess(updated.full_name);
        } else {
          showToast("Profile updated successfully");
        }

        return updated;
      } catch (err: unknown) {
        const msg = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : "Failed to update profile.");
        setAuthError(msg);
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authStep, finalizeAuthSuccess, showToast],
  );

  const skipOnboarding = useCallback(() => {
    finalizeAuthSuccess(currentUser?.name || "Customer");
  }, [currentUser?.name, finalizeAuthSuccess]);

  const verifyOtp = useCallback(
    async (code: string) => {
      const formattedPhone = normalizePhone(authPhone);
      setAuthError("");
      setIsSubmitting(true);

      try {
        const res = await authApi.verifyOtp(challengeId, formattedPhone, code);
        const [savedList, followedList] = await Promise.all([
          customerApi.getSavedBusinesses().catch(() => []),
          customerApi.getFollowedBusinesses().catch(() => []),
        ]);
        const s = savedList.map((b) => b.id);
        const f = followedList.map((b) => b.id);
        setSavedIds(s);
        setFollowedIds(f);

        const customer = mapUserToCustomer(res.user, s, f);
        setCurrentUser(customer);

        // Transition new users or users with incomplete profiles to onboarding
        if (res.is_new_user || !customer.profileCompleted) {
          setAuthStep("onboarding");
          setDevOtp("");
          return;
        }

        // Existing complete user enters app
        if (pendingIntent) {
          if (pendingIntent.type === "save") {
            try {
              await customerApi.saveBusiness(pendingIntent.businessId);
              const nextSaved = Array.from(new Set([...s, pendingIntent.businessId]));
              setSavedIds(nextSaved);
              setCurrentUser((u) => (u ? { ...u, savedBusinessIds: nextSaved } : null));
              showToast("Saved to your places");
            } catch {
              showToast("Signed in, but failed to save place");
            }
          } else if (pendingIntent.type === "follow") {
            try {
              await customerApi.followBusiness(pendingIntent.businessId);
              const nextFollowed = Array.from(new Set([...f, pendingIntent.businessId]));
              setFollowedIds(nextFollowed);
              setCurrentUser((u) => (u ? { ...u, followedBusinessIds: nextFollowed } : null));
              showToast("Following updates");
            } catch {
              showToast("Signed in, but failed to follow");
            }
          } else if (pendingIntent.type === "callback") {
            pendingIntent.callback();
          } else if (pendingIntent.type === "redirect") {
            router.push(pendingIntent.url);
          }
        } else {
          showToast("Welcome back!");
        }

        setPendingIntent(null);
        setAuthStep(null);
        setDevOtp("");
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setAuthError(err.message);
        } else {
          setAuthError("Failed to verify code. Please try again.");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [authPhone, challengeId, pendingIntent, router, showToast],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Clear client state even if network call failed
    }
    setCurrentUser(null);
    setSavedIds([]);
    setFollowedIds([]);
    setAuthStep(null);
    setPendingIntent(null);
    showToast("Signed out");
  }, [showToast]);

  const startSignIn = useCallback(() => {
    setPendingIntent(null);
    setAuthError("");
    setAuthStep("phone");
  }, []);

  const pendingActionLegacy =
    pendingIntent &&
    (pendingIntent.type === "save" || pendingIntent.type === "follow")
      ? { type: pendingIntent.type, businessId: pendingIntent.businessId }
      : null;

  const value: CustomerContextValue = {
    currentUser,
    authReady,
    authStep,
    authError,
    authPhone,
    devOtp,
    isSubmitting,
    pendingAction: pendingActionLegacy,
    isAuthenticated: Boolean(currentUser),
    isSaved: (businessId) => savedIds.includes(businessId),
    isFollowing: (businessId) => followedIds.includes(businessId),
    requestAction,
    requestAuth,
    closeAuth: () => {
      setAuthStep(null);
      setPendingIntent(null);
      setAuthError("");
    },
    continueToPhone,
    setAuthPhone,
    submitPhone,
    verifyOtp,
    updateProfile,
    skipOnboarding,
    saveBusiness,
    unsaveBusiness,
    followBusiness,
    unfollowBusiness,
    logout,
    startSignIn,
    toast,
    showToast,
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
      <AuthModalFlow />
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

function AuthModalFlow() {
  const customer = useCustomer();
  const [otpValue, setOtpValue] = useState("");
  const [onboardingName, setOnboardingName] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!customer.authStep) {
      setOtpValue("");
      setOnboardingName("");
      return;
    }
    if (customer.authStep === "onboarding") {
      const existing = customer.currentUser?.name;
      if (existing && !existing.startsWith("Customer ")) {
        setOnboardingName(existing);
      } else {
        setOnboardingName("");
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") customer.closeAuth();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [customer.authStep, customer]);

  if (!customer.authStep) return null;

  if (customer.authStep === "prompt") {
    const noun =
      customer.pendingAction?.type === "follow"
        ? "your favorite places"
        : "places you love";
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
  const isOnboarding = customer.authStep === "onboarding";

  const handleOtpInput = (value: string) => {
    setOtpValue(value);
    if (value.length === 6 && !customer.isSubmitting) {
      customer.verifyOtp(value);
    }
  };

  const handleOnboardingSubmit = async () => {
    if (!onboardingName.trim() || customer.isSubmitting) return;
    try {
      await customer.updateProfile(onboardingName.trim());
    } catch {
      // Error handled by updateProfile setting authError
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-xs p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !customer.isSubmitting) {
          customer.closeAuth();
        }
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
          onClick={isOnboarding ? customer.skipOnboarding : customer.closeAuth}
          disabled={customer.isSubmitting}
        >
          <span className="material-symbols-outlined text-[19px]" aria-hidden="true">
            {isOnboarding ? "close" : "arrow_back"}
          </span>
          {isOnboarding ? "Skip" : "Back"}
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          {isOnboarding ? "New account" : "Cafnet account"}
        </p>
        <h2 id="auth-flow-title" className="mt-2 text-2xl sm:text-3xl font-bold text-on-surface">
          {isOnboarding
            ? "Complete your profile"
            : isOtp
            ? "Enter your code"
            : "Sign in to Cafnet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {isOnboarding
            ? "What should we call you? Enter your name for reservations and reviews."
            : isOtp
            ? "Enter the 6-digit code sent to your phone."
            : "Save places, follow kitchens, and manage your reservations."}
        </p>

        {isOnboarding ? (
          <>
            <label htmlFor="auth-name-input" className="mt-7 block text-sm font-semibold text-on-surface">
              Your name
            </label>
            <input
              id="auth-name-input"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              type="text"
              placeholder="e.g. Samuel Kebede"
              value={onboardingName}
              onChange={(event) => setOnboardingName(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !customer.isSubmitting) handleOnboardingSubmit();
              }}
              autoFocus
              maxLength={100}
              disabled={customer.isSubmitting}
            />
            <button
              type="button"
              className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-60"
              onClick={handleOnboardingSubmit}
              disabled={customer.isSubmitting || onboardingName.trim().length < 2}
            >
              {customer.isSubmitting ? "Saving profile..." : "Save and continue"}
            </button>
            <button
              type="button"
              className="mt-2 h-10 w-full rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
              onClick={customer.skipOnboarding}
              disabled={customer.isSubmitting}
            >
              Skip for now
            </button>
          </>
        ) : isOtp ? (
          <>
            <label htmlFor="auth-otp-input" className="mt-7 block text-sm font-semibold text-on-surface">
              Verification code
            </label>
            <input
              id="auth-otp-input"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-center text-lg tracking-[0.35em] font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otpValue}
              onChange={(event) => handleOtpInput(event.target.value)}
              autoFocus
              disabled={customer.isSubmitting}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
              <span>
                Verification code: <strong>{customer.devOtp || "123456"}</strong>
              </span>
              <button
                type="button"
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={customer.continueToPhone}
                disabled={customer.isSubmitting}
              >
                Change number
              </button>
            </div>
          </>
        ) : (
          <>
            <label htmlFor="auth-phone-input" className="mt-7 block text-sm font-semibold text-on-surface">
              Ethiopian phone number
            </label>
            <input
              id="auth-phone-input"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              type="tel"
              inputMode="tel"
              placeholder="+251 9XX XXX XXX or 09XX XXX XXX"
              value={customer.authPhone}
              onChange={(event) => customer.setAuthPhone(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !customer.isSubmitting) customer.submitPhone();
              }}
              autoFocus
              disabled={customer.isSubmitting}
            />
            <button
              type="button"
              className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-60"
              onClick={customer.submitPhone}
              disabled={customer.isSubmitting}
            >
              {customer.isSubmitting ? "Sending code..." : "Continue with code"}
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
