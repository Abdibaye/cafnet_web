"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";

export default function AccountSettingsPage() {
  const { authReady, isAuthenticated, currentUser, startSignIn, logout } = useCustomer();

  if (!authReady) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
        Loading settings...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Sign in to Cafnet</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Please sign in to access your account settings.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16">
      <Link href="/account" className="text-sm font-semibold text-primary">
        ← Back to profile
      </Link>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Cafnet account
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">Settings</h1>

      <div className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white">
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Email Address</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            {currentUser?.email || "No email address attached"}
          </p>
        </div>
        {currentUser?.phone && (
          <div className="p-5">
            <h2 className="font-semibold text-on-surface">Phone Number</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {currentUser.phone}
            </p>
          </div>
        )}
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Authentication Status</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-emerald-500" />
            <p className="text-sm text-on-surface-variant">
              Active authenticated session (Role: {currentUser?.role || "CUSTOMER"})
            </p>
          </div>
        </div>
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Language</h2>
          <p className="mt-1 text-sm text-on-surface-variant">English</p>
        </div>
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Notifications</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Email and SMS notifications for reservation updates are enabled.
          </p>
        </div>
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Account Security</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Your Cafnet account is secured with email and password authentication and HTTP-only session cookies.
          </p>
        </div>
        <div className="p-5">
          <h2 className="font-semibold text-on-surface">Session Management</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Sign out of your active session on this device.
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-secondary hover:text-secondary/80"
            onClick={logout}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}