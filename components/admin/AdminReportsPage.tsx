"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listBusinessReports } from "@/lib/api/admin";
import { listBusinesses } from "@/lib/api/businesses";
import type { BusinessReport, ReportStatus, BusinessReportReason, Business } from "@/lib/api/types";

type FilterTab = "PENDING" | "DISMISSED" | "ACTIONED" | "ALL";

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

export default function AdminReportsPage() {
  const [reports, setReports] = useState<BusinessReport[]>([]);
  const [businesses, setBusinesses] = useState<Record<number, Business>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("PENDING");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportsData, bizResult] = await Promise.all([
        listBusinessReports({
          status: activeTab === "ALL" ? "ALL" : activeTab,
        }),
        listBusinesses({ limit: 100 }).catch(() => ({ businesses: [] })),
      ]);

      setReports(reportsData || []);
      const bMap: Record<number, Business> = {};
      for (const b of bizResult?.businesses || []) {
        bMap[b.id] = b;
      }
      setBusinesses(bMap);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pending = reports.filter((r) => r.status === "PENDING");
  const dismissed = reports.filter((r) => r.status === "DISMISSED");
  const actioned = reports.filter((r) => r.status === "ACTIONED");

  const renderStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            Pending
          </span>
        );
      case "DISMISSED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">close</span>
            Dismissed
          </span>
        );
      case "ACTIONED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <span className="material-symbols-outlined text-[13px]">check_circle</span>
            Actioned
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="border-b border-outline-variant pb-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Governance & Quality
          </span>
          <span className="text-outline-variant">·</span>
          <span className="text-xs text-on-surface-variant font-medium">Information Accuracy</span>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-on-surface">Business reports</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review customer reports of inaccurate business hours, closed venues, wrong locations, or invalid phone numbers.
        </p>

        {/* Tab Navigation */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-outline-variant">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "PENDING"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Pending
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {pending.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ACTIONED")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "ACTIONED"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Actioned
            {actioned.length > 0 && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                {actioned.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DISMISSED")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "DISMISSED"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Dismissed
            {dismissed.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {dismissed.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              activeTab === "ALL"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            All
            {reports.length > 0 && (
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs font-bold text-on-surface">
                {reports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-outline-variant/60 bg-white p-5"
              />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-outline">
              {activeTab === "PENDING"
                ? "check_circle"
                : activeTab === "ACTIONED"
                ? "task_alt"
                : "flag"}
            </span>
            <h2 className="mt-3 text-base font-bold text-on-surface">
              {activeTab === "PENDING"
                ? "No business reports need your attention."
                : activeTab === "DISMISSED"
                ? "No dismissed reports."
                : activeTab === "ACTIONED"
                ? "No actioned reports."
                : "No business reports found."}
            </h2>
            <p className="mt-1 text-xs">
              {activeTab === "PENDING"
                ? "All customer reports regarding business accuracy have been processed."
                : "Reports will be archived here once reviewed."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const { label: reasonLabel, icon: reasonIcon } = getReasonInfo(report.reason);
              const business = businesses[report.business_id];

              return (
                <div
                  key={report.id}
                  className="flex flex-col justify-between gap-5 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all sm:flex-row sm:items-center hover:border-primary/30"
                >
                  <div className="min-w-0 flex-1">
                    {/* Header info */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-bold text-base text-on-surface">
                        {business ? business.name : `Business #${report.business_id}`}
                      </h2>
                      <span className="rounded-md bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-secondary">
                        ID: #{report.business_id}
                      </span>
                      <div className="ml-auto sm:ml-2">{renderStatusBadge(report.status)}</div>
                    </div>

                    {/* Reported Issue Badge */}
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50/70 border border-red-200/60 rounded-lg px-2.5 py-1 w-fit">
                      <span className="material-symbols-outlined text-[15px]">{reasonIcon}</span>
                      <span>{reasonLabel}</span>
                    </div>

                    {/* Short details */}
                    {report.details && (
                      <p className="mt-2.5 text-xs text-on-surface italic line-clamp-2 bg-surface-container-low/60 rounded-lg p-2.5 border border-outline-variant/40">
                        &ldquo;{report.details}&rdquo;
                      </p>
                    )}

                    {/* Reporter & Submitted Date */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-on-surface-variant">
                      <span>
                        Reported by:{" "}
                        <strong className="font-semibold text-on-surface">
                          {report.reporter_user_id}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Submitted on{" "}
                        {new Date(report.created_at).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                      {report.reviewed_at && (
                        <>
                          <span>·</span>
                          <span>
                            Reviewed on{" "}
                            {new Date(report.reviewed_at).toLocaleDateString("en-US", {
                              dateStyle: "medium",
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex shrink-0">
                    <Link
                      href={`/admin/reports/${report.id}`}
                      className="inline-flex h-10 w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-sm hover:bg-[#0f46b8] transition-colors"
                    >
                      <span>Review</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
