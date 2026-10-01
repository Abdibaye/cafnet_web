"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import { useCustomerReviews } from "@/components/CustomerReviewProvider";

export default function CustomerAccountPage() {
  const { authReady, isAuthenticated, currentUser, startSignIn, logout, updateProfile } = useCustomer();
  const { reservations } = useReservations();
  const { userReviews } = useCustomerReviews();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleStartEdit = () => {
    setEditName(currentUser?.name || "");
    setEditError("");
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editName.trim();
    if (!trimmed || trimmed.length < 2) {
      setEditError("Name must be at least 2 characters.");
      return;
    }
    setIsSaving(true);
    setEditError("");
    try {
      await updateProfile(trimmed);
      setIsEditing(false);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!authReady) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">
        Loading account...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Sign in to Cafnet</h1>
        <p className="mt-3 text-sm text-on-surface-variant">
          Save places, manage reservations, and review your dining experiences.
        </p>
        <button
          type="button"
          className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]"
          onClick={startSignIn}
        >
          Sign in to your account
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Cafnet account
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">Profile</h1>

      <section className="mt-8 border border-outline-variant bg-white p-6">
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h2 className="text-lg font-bold text-on-surface">Edit Profile</h2>
            <div>
              <label htmlFor="edit-name" className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                Display Name
              </label>
              <input
                id="edit-name"
                type="text"
                className="mt-1 h-11 w-full rounded-lg border border-outline-variant px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={100}
                autoFocus
                disabled={isSaving}
              />
              {editError && (
                <p className="mt-1.5 text-xs text-secondary font-medium">{editError}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="h-9 rounded-lg bg-primary px-4 text-xs font-semibold text-white hover:bg-[#0f46b8] disabled:opacity-50"
                disabled={isSaving || editName.trim().length < 2}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                className="h-9 rounded-lg border border-outline-variant px-4 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary-container text-xl font-bold text-primary">
                {currentUser?.avatar}
              </span>
              <div>
                <h2 className="text-lg font-bold text-on-surface">{currentUser?.name}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">{currentUser?.email || currentUser?.phone}</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:border-primary hover:text-primary transition-colors cursor-pointer"
              onClick={handleStartEdit}
            >
              Edit
            </button>
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/saved"
          className="border border-outline-variant bg-white p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-sm font-semibold text-on-surface">Saved places</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {currentUser?.savedBusinessIds.length ?? 0}
          </p>
        </Link>
        <Link
          href="/following"
          className="border border-outline-variant bg-white p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-sm font-semibold text-on-surface">Following</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {currentUser?.followedBusinessIds.length ?? 0}
          </p>
        </Link>
        <Link
          href="/reservations"
          className="border border-outline-variant bg-white p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-sm font-semibold text-on-surface">Reservations</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {reservations.length}
          </p>
        </Link>
        <Link
          href="/reviews"
          className="border border-outline-variant bg-white p-5 hover:border-primary/40 transition-colors"
        >
          <p className="text-sm font-semibold text-on-surface">Reviews</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {userReviews.length}
          </p>
        </Link>
      </div>

      <section className="mt-8 border-t border-outline-variant pt-6">
        <h2 className="text-lg font-bold text-on-surface">Account</h2>
        <Link
          href="/account/settings"
          className="mt-4 block text-sm font-semibold text-primary"
        >
          Settings <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          className="mt-5 text-sm font-semibold text-secondary hover:text-secondary/80"
          onClick={logout}
        >
          Log out
        </button>
      </section>
    </div>
  );
}