"use client";

import { useState, useEffect } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import {
  BUSINESS_REPORT_REASONS,
  createBusinessReport as createBusinessReportInStorage,
  hasPendingReport,
  type BusinessReportReason,
} from "@/data/businessReportStorage";
import * as reportsApi from "@/lib/api/reports";

type ReportBusinessModalProps = {
  businessId: number;
  businessName: string;
};

export default function ReportBusinessModal({
  businessId,
  businessName,
}: ReportBusinessModalProps) {
  const { isAuthenticated, currentUser, startSignIn, showToast } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<BusinessReportReason>("WRONG_HOURS");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyReported, setAlreadyReported] = useState(false);

  // Check if current user already reported this business
  useEffect(() => {
    if (currentUser) {
      setAlreadyReported(hasPendingReport(businessId, currentUser.id));
    } else {
      setAlreadyReported(false);
    }
  }, [businessId, currentUser, isOpen]);

  const handleOpen = () => {
    if (!isAuthenticated) {
      startSignIn();
      return;
    }
    setErrorMessage(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setDetails("");
    setReason("WRONG_HOURS");
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      startSignIn();
      return;
    }

    if (reason === "OTHER" && !details.trim()) {
      setErrorMessage("Please describe the issue in the additional details field.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await reportsApi.reportBusiness(businessId, {
        reason: reason as any,
        details: details.trim() || undefined,
      });

      // Maintain storage synchronization for un-migrated admin moderation views
      createBusinessReportInStorage({
        businessId,
        businessName,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        reason,
        details,
      });

      showToast("Report submitted. Thanks for helping keep Cafnet accurate.");
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Subtle Entry Point Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="mt-5 flex w-full items-center justify-center gap-2 border-t border-outline-variant/60 pt-4 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
      >
        <span className="material-symbols-outlined text-[17px] text-secondary" aria-hidden="true">
          flag
        </span>
        Report incorrect information
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-outline-variant pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Information Accuracy
                </span>
                <h2 id="report-modal-title" className="mt-1 text-lg font-bold text-on-surface">
                  What&apos;s wrong with this listing?
                </h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Help us verify details for <span className="font-semibold text-on-surface">{businessName}</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                aria-label="Close dialog"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* If user already reported */}
            {alreadyReported ? (
              <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
                <span className="material-symbols-outlined text-3xl text-amber-700">info</span>
                <h3 className="mt-2 text-sm font-bold text-amber-900">You&apos;ve already reported this issue.</h3>
                <p className="mt-1 text-xs text-amber-800">
                  A report for this business is already pending review with our moderation team. Thanks for your vigilance!
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-amber-800 px-4 text-xs font-bold text-white hover:bg-amber-900"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Reason Options Selection */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary">
                    Select the issue
                  </label>
                  <div className="space-y-2">
                    {BUSINESS_REPORT_REASONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-xs transition-all ${
                          reason === opt.value
                            ? "border-primary bg-primary-container/20 ring-1 ring-primary"
                            : "border-outline-variant hover:bg-surface-container-low"
                        }`}
                      >
                        <input
                          type="radio"
                          name="reportReason"
                          value={opt.value}
                          checked={reason === opt.value}
                          onChange={() => {
                            setReason(opt.value);
                            setErrorMessage(null);
                          }}
                          className="mt-0.5 size-4 text-primary focus:ring-primary"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-on-surface">{opt.label}</p>
                          <p className="mt-0.5 text-[11px] text-on-surface-variant leading-tight">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <label
                    htmlFor="report-details"
                    className="block text-xs font-bold text-on-surface"
                  >
                    Additional details{" "}
                    {reason === "OTHER" ? (
                      <span className="text-red-600">*</span>
                    ) : (
                      <span className="font-normal text-on-surface-variant">(optional)</span>
                    )}
                  </label>
                  <textarea
                    id="report-details"
                    rows={3}
                    maxLength={500}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={
                      reason === "WRONG_HOURS"
                        ? "e.g., Opens at 9:00 AM instead of 10:00 AM..."
                        : reason === "WRONG_LOCATION"
                        ? "e.g., The restaurant moved across the street near Edna Mall..."
                        : reason === "CLOSED"
                        ? "e.g., Sign on door says permanently closed since last month..."
                        : "Describe the inaccuracy or provide correct details..."
                    }
                    className="mt-1.5 w-full rounded-xl border border-outline-variant p-3 text-xs leading-5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <p className="mt-1 text-right text-[11px] text-on-surface-variant">
                    {details.length}/500
                  </p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
                    {errorMessage}
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-outline-variant pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl border border-outline-variant px-4 text-xs font-semibold text-on-surface hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f46b8] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[17px]">send</span>
                    {isSubmitting ? "Submitting..." : "Submit report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
