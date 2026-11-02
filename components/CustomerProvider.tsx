"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import dynamic from "next/dynamic";
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

const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

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

  const isSaved = useCallback((businessId: number) => savedIds.includes(businessId), [savedIds]);
  const isFollowing = useCallback((businessId: number) => followedIds.includes(businessId), [followedIds]);
  const closeAuth = useCallback(() => {
    setAuthStep(null);
    setPendingIntent(null);
    setAuthError("");
  }, []);

  const value = useMemo<CustomerContextValue>(
    () => ({
      currentUser,
      authReady,
      authStep,
      authError,
      authPhone,
      devOtp,
      isSubmitting,
      pendingAction: pendingActionLegacy,
      isAuthenticated: Boolean(currentUser),
      isSaved,
      isFollowing,
      requestAction,
      requestAuth,
      closeAuth,
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
    }),
    [
      currentUser,
      authReady,
      authStep,
      authError,
      authPhone,
      devOtp,
      isSubmitting,
      pendingActionLegacy,
      isSaved,
      isFollowing,
      requestAction,
      requestAuth,
      closeAuth,
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
    ],
  );

  return (
    <CustomerContext.Provider value={value}>
      {children}
      {authStep && <AuthModal />}
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

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error("useCustomer must be used inside CustomerProvider");
  return context;
}
