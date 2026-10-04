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
  email?: string;
  phone?: string;
  avatar: string;
  role?: string;
  profileCompleted: boolean;
  savedBusinessIds: number[];
  followedBusinessIds: number[];
};

export type CustomerUser = MockCustomer;

export type CustomerAction = "save" | "follow";
export type AuthStep = "prompt" | "signin" | "signup" | "phone" | "otp" | "onboarding" | null;

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
    mode?: "signin" | "signup";
  }) => void;
  closeAuth: () => void;
  continueToPhone: () => void;
  setAuthPhone: (phone: string) => void;
  submitPhone: () => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  updateProfile: (fullName: string, avatarUrl?: string) => Promise<User>;
  skipOnboarding: () => void;
  saveBusiness: (businessId: number) => Promise<void>;
  unsaveBusiness: (businessId: number) => Promise<void>;
  followBusiness: (businessId: number) => Promise<void>;
  unfollowBusiness: (businessId: number) => Promise<void>;
  logout: () => Promise<void>;
  startSignIn: () => void;
  startSignUp: () => void;
  setAuthStep: (step: AuthStep) => void;
  toast: string;
  showToast: (message: string) => void;
};

const CustomerContext = createContext<CustomerContextValue | null>(null);

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
    email: user.email,
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
        setSavedIds(prev);
        setCurrentUser((u) => (u ? { ...u, savedBusinessIds: prev } : null));
        const msg = err instanceof ApiError ? err.message : "Failed to unsave place";
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
      mode?: "signin" | "signup";
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
      setAuthStep(options?.mode || "signin");
    },
    [currentUser, router],
  );

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

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setAuthError("");
      setIsSubmitting(true);
      try {
        const res = await authApi.signup({
          name: name.trim(),
          email: email.trim(),
          password,
        });

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

        await finalizeAuthSuccess(customer.name);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setAuthError(err.message);
        } else {
          setAuthError("Failed to create account. Please check your information.");
        }
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [finalizeAuthSuccess],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setAuthError("");
      setIsSubmitting(true);
      try {
        const res = await authApi.signin({
          email: email.trim(),
          password,
        });

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

        await finalizeAuthSuccess(customer.name);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          setAuthError(err.message);
        } else {
          setAuthError("Invalid email or password.");
        }
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [finalizeAuthSuccess],
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
    setAuthStep("signin");
  }, []);

  const startSignUp = useCallback(() => {
    setPendingIntent(null);
    setAuthError("");
    setAuthStep("signup");
  }, []);

  // Legacy stubs kept for backwards compatibility
  const continueToPhone = useCallback(() => {
    setAuthStep("signin");
  }, []);

  const submitPhone = useCallback(async () => {
    setAuthError("Phone authentication is deprecated. Please sign in with email and password.");
  }, []);

  const verifyOtp = useCallback(async (_code: string) => {
    setAuthError("Phone verification is deprecated. Please sign in with email and password.");
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
    signUp,
    signIn,
    updateProfile,
    skipOnboarding,
    saveBusiness,
    unsaveBusiness,
    followBusiness,
    unfollowBusiness,
    logout,
    startSignIn,
    startSignUp,
    setAuthStep,
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
  const [onboardingName, setOnboardingName] = useState("");
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(true);
  const [showSignUpPassword, setShowSignUpPassword] = useState(true);
  const [showSignUpConfirmPassword, setShowSignUpConfirmPassword] = useState(true);
  const [clientError, setClientError] = useState("");
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!customer.authStep) {
      setOnboardingName("");
      setSignInEmail("");
      setSignInPassword("");
      setSignUpName("");
      setSignUpEmail("");
      setSignUpPassword("");
      setSignUpConfirmPassword("");
      setShowSignInPassword(true);
      setShowSignUpPassword(true);
      setShowSignUpConfirmPassword(true);
      setClientError("");
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
      if (e.key === "Escape" && !customer.isSubmitting) customer.closeAuth();
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
                Sign in or create a free account to keep {noun} in one place.
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
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              onClick={() => customer.setAuthStep("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className="flex h-11 w-full items-center justify-center rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              onClick={() => customer.setAuthStep("signup")}
            >
              Create account
            </button>
          </div>
        </section>
      </div>
    );
  }

  const isSignIn = customer.authStep === "signin";
  const isSignUp = customer.authStep === "signup";
  const isOnboarding = customer.authStep === "onboarding";

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");
    if (!signInEmail.trim() || !signInPassword) {
      setClientError("Please enter your email and password.");
      return;
    }
    try {
      await customer.signIn(signInEmail, signInPassword);
    } catch {
      // Handled by customer.signIn
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError("");
    const trimmedName = signUpName.trim();
    const trimmedEmail = signUpEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setClientError("Name must be at least 2 characters.");
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setClientError("Please enter a valid email address.");
      return;
    }
    if (signUpPassword.length < 8) {
      setClientError("Password must be at least 8 characters.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setClientError("Passwords do not match.");
      return;
    }

    try {
      await customer.signUp(trimmedName, trimmedEmail, signUpPassword);
    } catch {
      // Handled by customer.signUp
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

  const errorToShow = clientError || customer.authError;

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
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            {isOnboarding
              ? "New account"
              : isSignUp
              ? "Create Account"
              : "Welcome back"}
          </p>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
            onClick={isOnboarding ? customer.skipOnboarding : customer.closeAuth}
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>

        <h2 id="auth-flow-title" className="text-2xl sm:text-3xl font-bold text-on-surface">
          {isOnboarding
            ? "Complete your profile"
            : isSignUp
            ? "Create your account"
            : "Sign in to Cafnet"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {isOnboarding
            ? "What should we call you? Enter your name for reservations and reviews."
            : isSignUp
            ? "Join Cafnet to save your favorite cafes, reserve tables, and share reviews."
            : "Enter your email and password to access your Cafnet account."}
        </p>

        {isOnboarding && (
          <div className="mt-6">
            <label htmlFor="auth-name-input" className="block text-sm font-semibold text-on-surface">
              Display name
            </label>
            <input
              id="auth-name-input"
              className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              type="text"
              placeholder="e.g. Samuel Kebede"
              value={onboardingName}
              onChange={(e) => setOnboardingName(e.target.value)}
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
          </div>
        )}

        {isSignIn && (
          <form onSubmit={handleSignInSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-semibold text-on-surface">
                Email address
              </label>
              <input
                id="signin-email"
                className="mt-1.5 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={signInEmail}
                onChange={(e) => {
                  setSignInEmail(e.target.value);
                  setClientError("");
                }}
                autoFocus
                required
                disabled={customer.isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-sm font-semibold text-on-surface">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="signin-password"
                  className="h-12 w-full rounded-xl border border-outline-variant bg-white pl-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  type={showSignInPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={showSignInPassword ? "Enter your password" : "••••••••"}
                  value={signInPassword}
                  onChange={(e) => {
                    setSignInPassword(e.target.value);
                    setClientError("");
                  }}
                  required
                  disabled={customer.isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword((prev) => !prev)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary cursor-pointer transition-colors"
                  aria-label={showSignInPassword ? "Hide password" : "Show password"}
                  title={showSignInPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showSignInPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-60"
              disabled={customer.isSubmitting}
            >
              {customer.isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <div className="pt-2 text-center text-sm text-on-surface-variant">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={() => {
                  setClientError("");
                  setShowSignUpPassword(true);
                  setShowSignUpConfirmPassword(true);
                  customer.setAuthStep("signup");
                }}
                disabled={customer.isSubmitting}
              >
                Create account
              </button>
            </div>
          </form>
        )}

        {isSignUp && (
          <form onSubmit={handleSignUpSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-sm font-semibold text-on-surface">
                Full name
              </label>
              <input
                id="signup-name"
                className="mt-1.5 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                type="text"
                autoComplete="name"
                placeholder="e.g. Abebe Bikila"
                value={signUpName}
                onChange={(e) => {
                  setSignUpName(e.target.value);
                  setClientError("");
                }}
                autoFocus
                required
                disabled={customer.isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-semibold text-on-surface">
                Email address
              </label>
              <input
                id="signup-email"
                className="mt-1.5 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={signUpEmail}
                onChange={(e) => {
                  setSignUpEmail(e.target.value);
                  setClientError("");
                }}
                required
                disabled={customer.isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-semibold text-on-surface">
                Password <span className="text-xs font-normal text-on-surface-variant">(min 8 characters)</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="signup-password"
                  className="h-12 w-full rounded-xl border border-outline-variant bg-white pl-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  type={showSignUpPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={showSignUpPassword ? "Enter password" : "••••••••"}
                  value={signUpPassword}
                  onChange={(e) => {
                    setSignUpPassword(e.target.value);
                    setClientError("");
                  }}
                  required
                  disabled={customer.isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword((prev) => !prev)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary cursor-pointer transition-colors"
                  aria-label={showSignUpPassword ? "Hide password" : "Show password"}
                  title={showSignUpPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showSignUpPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-on-surface">
                Confirm password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="signup-confirm-password"
                  className="h-12 w-full rounded-xl border border-outline-variant bg-white pl-4 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  type={showSignUpConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder={showSignUpConfirmPassword ? "Re-enter password" : "••••••••"}
                  value={signUpConfirmPassword}
                  onChange={(e) => {
                    setSignUpConfirmPassword(e.target.value);
                    setClientError("");
                  }}
                  required
                  disabled={customer.isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpConfirmPassword((prev) => !prev)}
                  className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-on-surface-variant hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary cursor-pointer transition-colors"
                  aria-label={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                  title={showSignUpConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                    {showSignUpConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer disabled:opacity-60"
              disabled={customer.isSubmitting}
            >
              {customer.isSubmitting ? "Creating account..." : "Create account"}
            </button>

            <div className="pt-2 text-center text-sm text-on-surface-variant">
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-primary hover:underline cursor-pointer"
                onClick={() => {
                  setClientError("");
                  setShowSignInPassword(true);
                  customer.setAuthStep("signin");
                }}
                disabled={customer.isSubmitting}
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {errorToShow && (
          <p className="mt-4 rounded-lg bg-secondary-container/40 p-3 text-sm font-semibold text-secondary" role="alert">
            {errorToShow}
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
