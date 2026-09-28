"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadBusinessOwnerState, type BusinessSubmission } from "@/data/businessOwnerStorage";

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>(
    () => loadBusinessOwnerState().submissions
  );
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const reload = () => {
    setSubmissions(loadBusinessOwnerState().submissions);
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
  }, []);

  const filtered = submissions.filter((sub) => {
    if (statusFilter === "all") return true;
    return sub.status === statusFilter;
  });

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
          Platform Governance
        </p>
        <h1 className="mt-1 text-3xl font-bold text-on-surface">Business submissions</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Review new business listing requests and publish them to Cafnet.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-outline-variant">
        {[
          { key: "all", label: "All Submissions", count: submissions.length },
          { key: "pending", label: "Pending", count: pendingCount },
          { key: "approved", label: "Approved", count: submissions.filter((s) => s.status === "approved").length },
          { key: "rejected", label: "Rejected", count: submissions.filter((s) => s.status === "rejected").length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-colors ${
              statusFilter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                statusFilter === tab.key
                  ? "bg-primary-container text-primary"
                  : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl text-outline">post_add</span>
          <h2 className="mt-3 text-base font-bold text-on-surface">No submissions found</h2>
          <p className="mt-1 text-xs">There are no business submissions in this view.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => {
            const isApproved = sub.status === "approved";
            const isRejected = sub.status === "rejected";
            const isPending = sub.status === "pending";

            return (
              <div
                key={sub.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm transition-all hover:border-outline-variant/80 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-on-surface">{sub.businessName}</h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isApproved
                          ? "bg-green-100 text-green-800"
                          : isRejected
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isApproved ? "check_circle" : isRejected ? "cancel" : "schedule"}
                      </span>
                      {isApproved ? "Published" : isRejected ? "Rejected" : "Pending review"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-on-surface-variant">
                    {sub.category === "cafe"
                      ? "Café"
                      : sub.category === "drinks"
                      ? "Drinks & More"
                      : "Restaurant"}{" "}
                    · {sub.area} · Submitted{" "}
                    {new Date(sub.submittedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  {isRejected && sub.rejectionReason && (
                    <p className="mt-2 text-xs italic text-red-700">
                      Reason: &ldquo;{sub.rejectionReason}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Link
                    href={`/admin/submissions/${sub.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
                  >
                    {isPending ? "Review submission" : "View details"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
