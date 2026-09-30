"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBusinessReport, resolveBusinessReport } from "@/lib/api/admin";
import { getBusinessProfile } from "@/lib/api/businesses";
import type { BusinessReport, Business, BusinessReportReason } from "@/lib/api/types";
import { useCustomer } from "@/components/CustomerProvider";

const REASON_LABELS: Record<string, { label: string; icon: string }> = {
  WRONG_HOURS: { label: "Wrong opening hours", icon: "schedule" },
  WRONG_PHONE: { label: "Wrong phone number", icon: "phone" },
  WRONG_LOCATION: { label: "Wrong location", icon: "location_on" },
  WRONG_INFORMATION: { label: "Wrong business information", icon: "info" },
  CLOSED: { label: "Business appears permanently closed", icon: "storefront" },
  DUPLICATE: { label: "Duplicate business", icon: "content_copy" },
  OTHER: { label: "Other", icon: "help_outline" },
};

function getReasonInfo(reason: BusinessReportReason) {
  return REASON_LABELS[reason] || { label: reason, icon: "flag" };
}

export default function AdminReportDetailPage({ reportId }: { reportId: string }) {
  const { showToast } = useCustomer();
  const [report, setReport] = useState<BusinessReport | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const [isDismissing, setIsDismissing] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const rep = await getBusinessReport(reportId);
      setReport(rep);
      if (rep?.business_id) {
        try {
          const bizData = await getBusinessProfile(rep.business_id);
          setBusiness(bizData.business);
        } catch {
          setBusiness(null);
        }
      }
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-36 animate-pulse rounded bg-outline-variant/40" />
        <div className="h-44 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
        <div className="h-60 animate-pulse rounded-2xl bg-white p-6 shadow-sm border border-outline-variant/60" />
      </div>
    );
  }

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

  const { label: reasonLabel, icon: reasonIcon } = getReasonInfo(report.reason);
  const businessName = business?.name || `Business #${report.business_id}`;

  const handleDismissSubmit = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await resolveBusinessReport(report.id, "DISMISSED", "Report dismissed by administrator");
      showToast("Report dismissed");
      setIsDismissing(false);
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to dismiss report.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionSubmit = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      await resolveBusinessReport(
        report.id,
        "ACTIONED",
        adminNotes.trim() || "Report actioned by administrator"
      );
      showToast("Report marked as actioned");
      setIsActioning(false);
      setAdminNotes("");
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to mark report as actioned.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
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
                {new Date(report.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold text-on-surface">{businessName}</h1>
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
            <span className="text-on-surface-variant font-medium">Reporter ID</span>
            <p className="font-mono font-semibold text-on-surface mt-0.5">
              {report.reporter_user_id}
            </p>
          </div>
          <div>
            <span className="text-on-surface-variant font-medium">Report Status</span>
            <p className="font-semibold text-on-surface mt-0.5">{report.status}</p>
          </div>
        </div>

        {/* Audit info if reviewed */}
        {report.reviewed_at && (
          <div className="mt-4 rounded-xl bg-surface-container-low p-3.5 text-xs text-on-surface-variant border border-outline-variant/60 space-y-1">
            <p className="font-bold text-on-surface">Review Resolution</p>
            <p>Reviewed on: {new Date(report.reviewed_at).toLocaleString("en-US")}</p>
            {report.reviewed_by && <p>Reviewed by: {report.reviewed_by}</p>}
            {report.admin_notes && (
              <p className="font-medium text-on-surface mt-1">Admin Notes: {report.admin_notes}</p>
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
              href={`/business/${report.business_id}`}
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant px-3.5 text-xs font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              Inspect public profile
            </Link>

            <Link
              href={`/admin/businesses/${report.business_id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-outline-variant px-3.5 text-xs font-semibold text-on-surface hover:border-primary/40 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Admin inspect
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
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.location_name || business.neighborhood}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Phone Number</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.phone || "Not set"}
              </p>
            </div>

            <div className="rounded-xl border border-outline-variant/60 p-3.5">
              <span className="text-on-surface-variant font-medium">Price Range</span>
              <p className="font-semibold text-on-surface text-sm mt-0.5">
                {business.price_range || "Not set"}
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
                {business.verification_status === "VERIFIED" ? "Verified badge active" : "Unverified"} ·{" "}
                {business.claim_status === "CLAIMED" ? "Claimed by owner" : "Unclaimed"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-on-surface-variant italic">
            Business listing #{report.business_id} could not be loaded.
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

      {/* DISMISS CONFIRMATION MODAL */}
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

      {/* ACTION CONFIRMATION MODAL */}
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
