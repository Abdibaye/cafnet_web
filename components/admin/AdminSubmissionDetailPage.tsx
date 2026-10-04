"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getSubmission, approveSubmission, rejectSubmission } from "@/lib/api/admin";
import type { BusinessSubmission } from "@/lib/api/types";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminSubmissionDetailPage({ submissionId }: { submissionId: string }) {
  const { showToast } = useCustomer();
  const [submission, setSubmission] = useState<BusinessSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSubmission(submissionId);
      setSubmission(data);
    } catch {
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

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

  if (!submission) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Submission not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          No submission found with ID #{submissionId}.
        </p>
        <Link
          href="/admin/submissions"
          className="mt-6 inline-flex text-sm font-semibold text-primary"
        >
          ← Return to submissions list
        </Link>
      </div>
    );
  }

  const isPending = submission.status === "PENDING";
  const isApproved = submission.status === "APPROVED";
  const isRejected = submission.status === "REJECTED";

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      await approveSubmission(submission.id);
      showToast("Business approved and published.");
      setIsApproving(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to approve submission";
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
      setRejectionError("Please provide a reason for rejecting this business submission.");
      return;
    }

    try {
      setIsSubmitting(true);
      await rejectSubmission(submission.id, trimmed);
      showToast("Business submission rejected");
      setIsRejecting(false);
      setRejectionReasonInput("");
      setRejectionError("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reject submission";
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
          href="/admin/submissions"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to submissions
        </Link>
      </div>

      {/* Header Card */}
      <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
              Submission Review #{submission.id}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">{submission.business_name}</h1>
            <p className="mt-1 text-xs text-on-surface-variant">
              Submitted{" "}
              {new Date(submission.submitted_at).toLocaleDateString("en-US", {
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
            {isApproved ? "Published Live" : isRejected ? "Rejected" : "Pending Review"}
          </span>
        </div>

        {/* Rejection notice if rejected */}
        {isRejected && submission.rejection_reason && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
            <p className="font-bold">Rejection Reason:</p>
            <p className="mt-1 italic">&ldquo;{submission.rejection_reason}&rdquo;</p>
            {submission.reviewed_at && (
              <p className="mt-2 text-[11px] text-red-700">
                Reviewed on {new Date(submission.reviewed_at).toLocaleDateString("en-US")} by{" "}
                {submission.reviewed_by || "Admin"}
              </p>
            )}
          </div>
        )}

        {/* Approval notice if approved */}
        {isApproved && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-xs text-green-800">
            <p className="font-bold">Approved & Published:</p>
            <p className="mt-1">
              This business is now live on Cafnet as ID #{submission.created_business_id}.
            </p>
            {submission.created_business_id && (
              <div className="mt-3 flex gap-3">
                <Link
                  href={`/business/${submission.created_business_id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  View live public listing
                </Link>
                <Link
                  href={`/admin/businesses/${submission.created_business_id}`}
                  className="inline-flex items-center gap-1 font-bold text-on-surface hover:underline"
                >
                  Inspect in Admin
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submitted Information Details */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-on-surface">Submitted listing details</h2>
        <div className="mt-4 space-y-3 divide-y divide-outline-variant/60 text-xs">
          <div className="flex justify-between pt-2">
            <span className="text-on-surface-variant">Business Name</span>
            <span className="font-bold text-on-surface">{submission.business_name}</span>
          </div>
          <div className="flex justify-between pt-3">
            <span className="text-on-surface-variant">Category</span>
            <span className="font-semibold text-on-surface">
              {submission.category === "cafe"
                ? "Café"
                : submission.category === "drinks"
                ? "Drinks & More"
                : "Restaurant"}
            </span>
          </div>
          <div className="flex justify-between pt-3">
            <span className="text-on-surface-variant">Area / Neighborhood</span>
            <span className="font-semibold text-on-surface">{submission.area}</span>
          </div>
          {Boolean(submission.submitted_payload?.phone) && (
            <div className="flex justify-between pt-3">
              <span className="text-on-surface-variant">Business Phone</span>
              <span className="font-semibold text-on-surface">{String(submission.submitted_payload?.phone)}</span>
            </div>
          )}
          <div className="flex justify-between pt-3">
            <span className="text-on-surface-variant">City</span>
            <span className="font-semibold text-on-surface">Addis Ababa, Ethiopia</span>
          </div>
          {submission.cover_image_url && (
            <div className="pt-3">
              <span className="text-on-surface-variant block mb-2">Cover Image</span>
              <div className="overflow-hidden rounded-xl border border-outline-variant/60">
                <img
                  src={submission.cover_image_url}
                  alt={submission.business_name}
                  className="h-52 w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/cafnet-placeholder.svg";
                  }}
                />
              </div>
            </div>
          )}
        </div>
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
            Reject submission
          </button>

          <button
            type="button"
            onClick={() => setIsApproving(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            Approve & publish
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
              <span className="material-symbols-outlined text-2xl">publish</span>
            </div>
            <h3 className="mt-4 text-lg font-bold text-on-surface">
              Publish &ldquo;{submission.business_name}&rdquo; to Cafnet?
            </h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              This will create a new live business record discoverable in Explore, Search, and
              Categories. The submitter will receive management rights to configure their menu,
              listing details, and updates.
            </p>

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
                {isSubmitting ? "Approving..." : "Approve & publish"}
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
            <h3 className="text-lg font-bold text-on-surface">Reject business submission</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              Please provide a clear reason explaining why this business submission was not approved.
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
                  placeholder="e.g. Duplicate business listing already exists on Cafnet, or invalid business name."
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
                  {isSubmitting ? "Rejecting..." : "Reject submission"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
