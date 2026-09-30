"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getClaim, approveClaim, rejectClaim } from "@/lib/api/admin";
import { getBusinessProfile } from "@/lib/api/businesses";
import type { BusinessClaim, Business } from "@/lib/api/types";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminClaimDetailPage({ claimId }: { claimId: string }) {
  const { showToast } = useCustomer();
  const [claim, setClaim] = useState<BusinessClaim | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalNotesInput, setApprovalNotesInput] = useState("");
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const claimData = await getClaim(claimId);
      setClaim(claimData);
      if (claimData?.business_id) {
        try {
          const bizData = await getBusinessProfile(claimData.business_id);
          setBusiness(bizData.business);
        } catch {
          setBusiness(null);
        }
      }
    } catch {
      setClaim(null);
    } finally {
      setLoading(false);
    }
  }, [claimId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-outline-variant/40" />
        <div className="h-44 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
        <div className="h-60 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Claim not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          No claim request found with ID #{claimId}.
        </p>
        <Link href="/admin/claims" className="mt-6 inline-flex text-sm font-semibold text-primary">
          ← Return to claims list
        </Link>
      </div>
    );
  }

  const isPending = claim.status === "PENDING";
  const isApproved = claim.status === "APPROVED";
  const isRejected = claim.status === "REJECTED";

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await approveClaim(claim.id, approvalNotesInput.trim() || undefined);
      showToast("Claim approved — manager rights granted");
      setIsApproving(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not approve claim";
      showToast(msg);
      setIsApproving(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rejectionReasonInput.trim();
    if (!trimmed) {
      setRejectionError("Please specify a reason for rejecting this claim.");
      return;
    }

    try {
      setIsSubmitting(true);
      await rejectClaim(claim.id, trimmed);
      showToast("Claim rejected");
      setIsRejecting(false);
      setRejectionReasonInput("");
      setRejectionError("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject claim";
      setRejectionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/admin/claims"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to claims
        </Link>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Ownership Claim Review #{claim.id}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">
              {business ? business.name : `Business #${claim.business_id}`}
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Submitted{" "}
              {new Date(claim.submitted_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1 self-start rounded-lg px-3 py-1 text-xs font-bold ${
              isApproved
                ? "bg-green-100 text-green-800"
                : isRejected
                ? "bg-red-100 text-red-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isApproved ? "check_circle" : isRejected ? "cancel" : "schedule"}
            </span>
            {isApproved ? "Approved & Granted" : isRejected ? "Rejected" : "Pending Review"}
          </span>
        </div>

        {/* Rejection notice if rejected */}
        {isRejected && claim.rejection_reason && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <p className="font-bold">Rejection Reason:</p>
            <p className="mt-1 italic">&ldquo;{claim.rejection_reason}&rdquo;</p>
            {claim.reviewed_at && (
              <p className="mt-2 text-[11px] text-red-700">
                Reviewed on {new Date(claim.reviewed_at).toLocaleDateString("en-US")} by{" "}
                {claim.reviewed_by || "Admin"}
              </p>
            )}
          </div>
        )}

        {/* Approval notice if approved */}
        {isApproved && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
            <p className="font-bold">Access Granted:</p>
            <p className="mt-1">
              User {claim.claimant_user_id} now manages this business profile, menu, and updates.
            </p>
            {claim.reviewed_at && (
              <p className="mt-2 text-[11px] text-green-700">
                Reviewed on {new Date(claim.reviewed_at).toLocaleDateString("en-US")} by{" "}
                {claim.reviewed_by || "Admin"}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Claim & Business Information */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-on-surface">Target business details</h2>
        <div className="mt-4 space-y-3 divide-y divide-outline-variant/60 text-xs">
          <div className="flex justify-between pt-2">
            <span className="text-on-surface-variant">Business ID</span>
            <span className="font-semibold text-on-surface">#{claim.business_id}</span>
          </div>
          {business && (
            <>
              <div className="flex justify-between pt-3">
                <span className="text-on-surface-variant">Business Name</span>
                <span className="font-bold text-on-surface">{business.name}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-on-surface-variant">Category / Cuisine</span>
                <span className="font-semibold text-on-surface">
                  {business.category} · {business.cuisine}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-on-surface-variant">Location</span>
                <span className="font-semibold text-on-surface">
                  {business.location_name || business.neighborhood}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between pt-3">
            <span className="text-on-surface-variant">Claimant User ID</span>
            <span className="font-mono font-semibold text-on-surface">
              {claim.claimant_user_id}
            </span>
          </div>
        </div>

        {business && (
          <div className="mt-5 flex gap-3 border-t border-outline-variant/60 pt-4">
            <Link
              href={`/business/${business.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              View public listing
            </Link>
            <Link
              href={`/admin/businesses/${business.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-on-surface hover:underline"
            >
              Inspect in Admin
            </Link>
          </div>
        )}
      </section>

      {/* Decision Actions Bar */}
      {isPending && (
        <section className="flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => setIsRejecting(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
            Reject claim
          </button>

          <button
            type="button"
            onClick={() => setIsApproving(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Approve claim
          </button>
        </section>
      )}

      {/* APPROVE CONFIRMATION MODAL */}
      {isApproving && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              Approve claim for &ldquo;{business?.name || `Business #${claim.business_id}`}&rdquo;?
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This will grant management rights to claimant <strong>{claim.claimant_user_id}</strong>.
              They will be able to edit business details, manage menus, and publish updates.
            </p>

            <div className="mt-4">
              <label
                htmlFor="approval-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
              >
                Approval Notes (optional)
              </label>
              <textarea
                id="approval-notes"
                rows={2}
                placeholder="e.g. Identity verified via trade license or phone call."
                value={approvalNotesInput}
                onChange={(e) => setApprovalNotesInput(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-outline-variant p-3 text-xs outline-none transition-colors focus:border-primary"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsApproving(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleApprove}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] disabled:opacity-50"
              >
                {isSubmitting ? "Approving..." : "Approve & grant"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL WITH REASON */}
      {isRejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Reject ownership claim</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Please specify why this ownership claim was rejected.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="claim-rejection-reason"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Reason for rejection *
                </label>
                <textarea
                  id="claim-rejection-reason"
                  rows={3}
                  autoFocus
                  placeholder="e.g. Business ownership could not be verified, or documentation invalid."
                  value={rejectionReasonInput}
                  onChange={(e) => {
                    setRejectionReasonInput(e.target.value);
                    if (rejectionError) setRejectionError("");
                  }}
                  className={`mt-1.5 w-full rounded-xl border p-3 text-sm outline-none transition-colors ${
                    rejectionError
                      ? "border-red-500 focus:border-red-500"
                      : "border-outline-variant focus:border-primary"
                  }`}
                />
                {rejectionError && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{rejectionError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectionReasonInput("");
                    setRejectionError("");
                  }}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Rejecting..." : "Reject claim"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
