"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBusinessById } from "@/data/mockBusinesses";
import {
  getBusinessReportById,
  dismissBusinessReport,
  actionBusinessReport,
  getReportReasonLabel,
  getReportReasonIcon,
  type BusinessReport,
} from "@/data/businessReportStorage";
import { useCustomer } from "@/components/CustomerProvider";

export default function AdminReportDetailPage({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { showToast } = useCustomer();
  const [report, setReport] = useState<BusinessReport | undefined>(() =>
    getBusinessReportById(reportId)
  );

  const [isDismissing, setIsDismissing] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = () => {
    setReport(getBusinessReportById(reportId));
  };

  useEffect(() => {
    reload();
    const handleUpdate = () => reload();
    window.addEventListener("cafnet:business-reports-updated", handleUpdate);
    return () => window.removeEventListener("cafnet:business-reports-updated", handleUpdate);
  }, [reportId]);

  if (!report) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="text-2xl font-bold text-on-surface">Report not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          No business information report exists with ID: {reportId}.
        </p>
        <Link
          href="/admin/reports"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8]"
        >
          Back to business reports
        </Link>
      </div>
    );
  }

  const business = getBusinessById(report.businessId);
  const reasonLabel = getReportReasonLabel(report.reason);
  const reasonIcon = getReportReasonIcon(report.reason);

  const handleDismissSubmit = () => {
    setIsProcessing(true);
    setErrorMessage(null);
    const result = dismissBusinessReport(report.id, "Cafnet Administrator");
    setIsProcessing(false);

    if (result.success) {
      showToast("Report dismissed");
      setIsDismissing(false);
      reload();
    } else {
      setErrorMessage(result.error || "Failed to dismiss report.");
    }
  };

  const handleActionSubmit = () => {
    setIsProcessing(true);
    setErrorMessage(null);
    const result = actionBusinessReport(report.id, "Cafnet Administrator", adminNotes);
    setIsProcessing(false);

    if (result.success) {
      showToast("Report marked as actioned");
      setIsActioning(false);
      setAdminNotes("");
      reload();
    } else {
      setErrorMessage(result.error || "Failed to mark report as actioned.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Navigation */}
      <div>
        <Link
          href="/admin/reports"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to business reports
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Report #{report.id}
              </span>
              <span className="text-outline-variant">·</span>
              <span className="text-xs text-on-surface-variant font-medium">
                Submitted{" "}
                {new Date(report.createdAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">
              {report.businessName}
            </h1>
          </div>

          <div>
            {report.status === "PENDING" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                <span className="material-symbols-outlined text-[15px]">schedule</span>
                Pending Review
              </span>
            )}
            {report.status === "DISMISSED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">close</span>
                Dismissed
              </span>
            )}
            {report.status === "ACTIONED" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                <span className="material-symbols-outlined text-[15px]">check_circle</span>
                Actioned
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Report Inaccuracy Breakdown */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-on-surface">Reported inaccuracy</h2>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-950 font-bold">
          <span className="material-symbols-outlined text-[20px] text-red-700">{reasonIcon}</span>
          <span>{reasonLabel}</span>
        </div>

        {report.details ? (
          <div className="mt-4 rounded-xl bg-surface-container-low p-4 text-xs leading-6 text-on-surface border border-outline-variant/60">
            <p className="font-bold text-secondary">Customer note:</p>
            <p className="mt-1 text-sm italic">&ldquo;{report.details}&rdquo;</p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-on-surface-variant italic">
            No additional text details provided with this report.
          </p>
        )}

        {/* Reporter info */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-outline-variant/60 pt-4 text-xs">
          <div>
            <span className="text-on-surface-variant font-medium">Reporter</span>
            <p className="font-semibold text-on-surface mt-0.5">
              {report.reporterName || report.reporterId}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant font-medium">Reporter ID</span>
            <p className="font-mono font-semibold text-on-surface mt-0.5">
              {report.reporterId}
            </p>
          </div>
        </div>

        {/* Audit info if reviewed */}
        {report.reviewedAt && (
          <div className="mt-4 rounded-xl bg-surface-container-low p-3.5 text-xs text-on-surface-variant border border-outline-variant/60 space-y-1">
            <p className="font-bold text-on-surface">Review Resolution</p>
            <p>Reviewed on: {new Date(report.reviewedAt).toLocaleString("en-US")}</p>
            {report.reviewedBy && <p>Reviewed by: {report.reviewedBy}</p>}
            {report.adminNotes && (
              <p className="font-medium text-on-surface mt-1">Admin Notes: {report.adminNotes}</p>
            )}
          </div>
        )}
      </section>

      {/* Safety Notice for High Impact Reports */}
      {report.reason === "CLOSED" && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm text-xs text-amber-950">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>Safety Rule: Do not automatically remove or hide listings</span>
          </div>
          <p className="mt-1 leading-5 text-amber-900">
            A customer report that a business appears closed is an advisory signal for review. Never automatically hide or delete a business from the platform based on a single customer report without verification.
          </p>
        </div>
      )}

      {/* Current Business Profile Snapshot */}
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <h2 className="text-base font-bold text-on-surface">Current live listing snapshot</h2>
            <p className="text-xs text-on-surface-variant">
              Examine live business details to compare against the customer&apos;s report.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/business/${report.businessId}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant px-3.5 text-xs font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Inspect public profile
            </Link>

            <Link
              href={`/business/dashboard/business/${report.businessId}/edit`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant px-3.5 text-xs font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Edit listing
            </Link>
          </div>
        </div>

        {business ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Business Name</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">{business.name}</p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Location</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">{business.location}</p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Phone Number</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.phone || "Not set"}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Opening Hours</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.openingHours || "Hours not set"}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Category & Cuisine</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.category} · {business.cuisine}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Status & Verification</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.verified ? "Verified badge active" : "Unverified"} ·{" "}
                {business.claimStatus === "claimed" ? "Claimed by owner" : "Unclaimed"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-on-surface-variant italic">
            Business listing #{report.businessId} could not be loaded.
          </p>
        )}
      </section>

      {/* Admin Actions Bar */}
      {report.status === "PENDING" && (
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-on-surface">Admin resolution</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            Choose whether to dismiss this report if the information is accurate, or mark as actioned after correcting the listing.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsActioning(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#0f46b8] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Mark as actioned
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setIsDismissing(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-5 text-sm font-semibold text-secondary hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              Dismiss report
            </button>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. DISMISS CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isDismissing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Dismiss this report?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              The business information will remain unchanged.
            </p>

            {errorMessage && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => setIsDismissing(false)}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDismissSubmit}
                disabled={isProcessing}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-secondary px-5 text-xs font-bold text-white shadow-sm hover:bg-secondary/90 disabled:opacity-50"
              >
                {isProcessing ? "Dismissing..." : "Dismiss"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ACTION CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isActioning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-on-surface">Mark report as actioned?</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Confirm that this report has been addressed and any necessary business corrections were made.
            </p>

            <div className="mt-4">
              <label
                htmlFor="admin-notes"
                className="block text-xs font-bold text-on-surface"
              >
                Administrative resolution notes{" "}
                <span className="font-normal text-on-surface-variant">(optional)</span>
              </label>
              <textarea
                id="admin-notes"
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Corrected weekday closing time to 11:00 PM in listing details..."
                className="mt-1.5 w-full rounded-xl border border-outline-variant p-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>

            {errorMessage && (
              <p className="mt-3 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-outline-variant pt-4">
              <button
                type="button"
                onClick={() => setIsActioning(false)}
                disabled={isProcessing}
                className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={isProcessing}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f46b8] disabled:opacity-50"
              >
                {isProcessing ? "Saving..." : "Confirm & mark actioned"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
