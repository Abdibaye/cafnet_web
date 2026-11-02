"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";

export default function AuthModal() {
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
