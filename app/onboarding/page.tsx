"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCustomer } from "@/components/CustomerProvider";

export default function OnboardingPage() {
  const router = useRouter();
  const { authReady, isAuthenticated, currentUser, startSignIn, updateProfile, skipOnboarding } = useCustomer();

  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authReady) return;

    if (isAuthenticated && currentUser?.profileCompleted) {
      router.push("/account");
    } else if (currentUser?.name && !currentUser.name.startsWith("Customer ")) {
      setName(currentUser.name);
    }
  }, [authReady, isAuthenticated, currentUser, router]);

  if (!authReady) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center text-sm text-on-surface-variant">
        Checking account status...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Cafnet Onboarding
        </p>
        <h1 className="mt-2 text-2xl font-bold text-on-surface">Sign in required</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Please verify your phone number to complete account setup.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Sign in with phone
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length < 2) {
      setError("Please enter a name of at least 2 characters.");
      return;
    }
    if (trimmed.length > 100) {
      setError("Name must not exceed 100 characters.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await updateProfile(trimmed);
      router.push("/account");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
    router.push("/account");
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <div className="rounded-2xl border border-outline-variant bg-white p-6 sm:p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Welcome to Cafnet
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-on-surface">
          Complete your profile
        </h1>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          Enter your display name for reservations, reviews, and community interactions.
        </p>

        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="onboarding-full-name" className="block text-sm font-semibold text-on-surface">
            Display name
          </label>
          <input
            id="onboarding-full-name"
            type="text"
            className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="e.g. Samuel Kebede"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoFocus
            disabled={isSubmitting}
          />

          {error && (
            <p className="mt-3 rounded-lg bg-secondary-container/40 p-3 text-sm font-medium text-secondary" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-60 cursor-pointer"
            disabled={isSubmitting || name.trim().length < 2}
          >
            {isSubmitting ? "Completing setup..." : "Complete account"}
          </button>

          <button
            type="button"
            className="mt-3 flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}
