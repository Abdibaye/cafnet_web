"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadBusinessOwnerState, type BusinessClaim } from "@/data/businessOwnerStorage";
import { getBusinessById } from "@/data/mockBusinesses";
import { getManagedBusiness } from "@/data/ownerManagedBusinessStorage";
import { approveClaim, rejectClaim } from "@/data/adminStorage";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminClaimDetailPage({ claimId }: { claimId: string }) {
  const router = useRouter();
  const { showToast } = useCustomer();
  const [claim, setClaim] = useState<BusinessClaim | undefined>(() =>
    loadBusinessOwnerState().claims.find((c) => c.id === claimId)
  );

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const reload = () => {
    setClaim(loadBusinessOwnerState().claims.find((c) => c.id === claimId));
  };

  useEffect(() => {
    reload();
    const handleEvents = () => reload();
    window.addEventListener("cafnet:admin-updated", handleEvents);
    window.addEventListener("cafnet:business-owner-updated", handleEvents);

    return () => {
      window.removeEventListener("cafnet:admin-updated", handleEvents);
      window.removeEventListener("cafnet:business-owner-updated", handleEvents);
    };
  }, [claimId]);

  if (!claim) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Claim not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">No claim request found with ID #{claimId}.</p>
        <Link href="/admin/claims" className="mt-6 inline-flex text-sm font-semibold text-primary">
          ← Return to claims list
        </Link>
      </div>
    );
  }

  const business = getBusinessById(claim.businessId);
  const existingManaged = getManagedBusiness(claim.businessId);
  const isAlreadyManaged = Boolean(existingManaged || business?.claimStatus === "claimed");

  const isPending = claim.status === "pending";
  const isApproved = claim.status === "approved";
  const isRejected = claim.status === "rejected";

  const handleApprove = () => {
    const success = approveClaim(claim.id);
    if (success) {
      showToast("Claim approved — business is now managed");
      setIsApproving(false);
      reload();
    } else {
      showToast("Could not approve claim — business is already managed");
      setIsApproving(false);
    }
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rejectionReasonInput.trim();
    if (!trimmed) {
      setRejectionError("Please specify a reason for rejecting this claim.");
      return;
    }

    const success = rejectClaim(claim.id, trimmed);
    if (success) {
      showToast("Claim rejected");
      setIsRejecting(false);
      setRejectionReasonInput("");
      setRejectionError("");
      reload();
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
              Claim Review #{claim.id}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">
              {business?.name || `Business #${claim.businessId}`}
            </h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Submitted{" "}
              {new Date(claim.submittedAt).toLocaleDateString("en-US", {
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
            {isApproved ? "Claim Approved" : isRejected ? "Claim Rejected" : "Pending Verification"}
          </span>
        </div>

        {/* Rejection explanation if rejected */}
        {isRejected && claim.rejectionReason && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <p className="font-bold">Rejection Reason:</p>
            <p className="mt-1 italic">&ldquo;{claim.rejectionReason}&rdquo;</p>
            {claim.reviewedAt && (
              <p className="mt-2 text-[11px] text-red-700">
                Reviewed on {new Date(claim.reviewedAt).toLocaleDateString("en-US")} by {claim.reviewedBy || "Admin"}
              </p>
            )}
          </div>
        )}

        {/* Approval info if approved */}
        {isApproved && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
            <p className="font-bold">Approved & Managed:</p>
            <p className="mt-1">
              Management access was granted to this business on{" "}
              {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString("en-US") : "recently"}.
            </p>
          </div>
        )}
      </div>

      {/* Competing Claim / Already Managed Warning */}
      {isPending && isAlreadyManaged && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
          <span className="material-symbols-outlined text-2xl text-amber-700">warning</span>
          <div className="text-xs leading-5">
            <h3 className="font-bold">Already Managed Business</h3>
            <p className="mt-1">
              This business is already managed on Cafnet. To protect ownership integrity, you cannot
              approve a second competing claim for this business without resolving the existing manager.
            </p>
          </div>
        </div>
      )}

      {/* Business Profile Preview Box */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant pb-4">
          <h2 className="text-base font-bold text-on-surface">Target business listing</h2>
          {business && (
            <Link
              href={`/business/${business.id}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-[#0f46b8]"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              View public profile
            </Link>
          )}
        </div>

        {business ? (
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {business.images && business.images.length > 0 && (
              <img
                src={business.images[0]}
                alt=""
                className="size-20 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1 space-y-1 text-xs text-on-surface-variant">
              <p className="text-sm font-bold text-on-surface">{business.name}</p>
              <p>{business.category} · {business.cuisine} · {business.location}</p>
              <p>Phone: {business.phone || "Not set"}</p>
              <p>Rating: {business.rating} ({business.reviewCount} reviews)</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-on-surface-variant">
            Target business details could not be loaded.
          </p>
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
            disabled={isAlreadyManaged}
            onClick={() => setIsApproving(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Approve claim
          </button>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* APPROVE CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isApproving && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              Approve claim for {business?.name}?
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              The claimant will immediately receive full management access to edit listings, manage
              menus, and post updates. The business will also automatically receive a basic verified
              status.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsApproving(false)}
                className="h-10 rounded-xl px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
              >
                Approve claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REJECT CONFIRMATION MODAL WITH REASON */}
      {/* ------------------------------------------------------------- */}
      {isRejecting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Reject claim request</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Please provide a clear reason for the owner explaining why this claim was rejected.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="rejection-reason"
                  className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                >
                  Reason for rejection *
                </label>
                <textarea
                  id="rejection-reason"
                  rows={3}
                  autoFocus
                  placeholder="e.g. Could not verify business ownership documents or phone number."
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
                  className="h-10 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-700"
                >
                  Confirm rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
