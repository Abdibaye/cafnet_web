"use client";

import Link from "next/link";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";

type BusinessStatusPageProps = {
  kind: "claim" | "submission";
  claimId?: string;
  submissionId?: string;
};

export default function BusinessStatusPage({ kind, claimId, submissionId }: BusinessStatusPageProps) {
  const { ready, claims, submissions, rawManagedBusinesses } = useBusinessOwner();
  if (!ready) {
    return <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-on-surface-variant">Loading request...</div>;
  }

  const claim = claims.find((item) => item.id === claimId);
  const submission = submissions.find((item) => item.id === submissionId);
  const businessId = claim ? claim.businessId : submission?.createdBusinessId;
  const managedBusiness = businessId ? rawManagedBusinesses.find((b) => b.id === businessId) : undefined;
  const businessName = managedBusiness?.name || submission?.businessName || (businessId ? `Business #${businessId}` : "Business");
  const businessLocation = managedBusiness?.location_name || managedBusiness?.neighborhood || submission?.area || "Addis Ababa";

  if (kind === "claim" && !claim) return <MissingStatus />;
  if (kind === "submission" && !submission) return <MissingStatus />;

  const status = (claim || submission)?.status || "pending";
  const submittedAt = (claim || submission)?.submittedAt;
  const reviewedAt = (claim || submission)?.reviewedAt;
  const rejectionReason = (claim || submission)?.rejectionReason;

  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const isPending = status === "pending";

  const statusLabel = isApproved
    ? "Approved"
    : isRejected
    ? "Not approved"
    : kind === "claim"
    ? "Pending verification"
    : "Pending review";

  const statusIcon = isApproved ? "check_circle" : isRejected ? "cancel" : "schedule";
  const statusColor = isApproved ? "text-green-600" : isRejected ? "text-red-600" : "text-secondary";

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 lg:px-0 lg:py-16">
      <Link href="/business/dashboard" className="text-sm font-semibold text-primary hover:text-[#0f46b8]">
        ← Business Center
      </Link>

      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
        Business Center
      </p>
      <h1 className="mt-2 text-3xl font-bold text-on-surface">
        {kind === "claim" ? "Claim request" : "Business submission"}
      </h1>

      <section className="mt-8 divide-y divide-outline-variant rounded-2xl border border-outline-variant bg-white">
        <div className="p-5">
          <p className="text-xs text-on-surface-variant">Business</p>
          <p className="mt-1 text-lg font-bold text-on-surface">
            {businessName}
          </p>
          {businessLocation && (
            <p className="mt-1 text-sm text-on-surface-variant">
              {businessLocation}
            </p>
          )}
        </div>

        {submission && (
          <>
            <div className="p-5">
              <p className="text-xs text-on-surface-variant">Category</p>
              <p className="mt-1 font-semibold text-on-surface">
                {submission.category === "cafe"
                  ? "Café"
                  : submission.category === "drinks"
                  ? "Drinks & More"
                  : "Restaurant"}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs text-on-surface-variant">Area</p>
              <p className="mt-1 font-semibold text-on-surface">{submission.area}</p>
            </div>
          </>
        )}

        <div className="p-5">
          <p className="text-xs text-on-surface-variant">Status</p>
          <p className={`mt-1 inline-flex items-center gap-2 font-semibold ${statusColor}`}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {statusIcon}
            </span>
            {statusLabel}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-on-surface-variant">Submitted</p>
          <p className="mt-1 font-semibold text-on-surface">
            {submittedAt
              ? new Date(submittedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Unknown"}
          </p>
        </div>

        {reviewedAt && (
          <div className="p-5">
            <p className="text-xs text-on-surface-variant">Decision date</p>
            <p className="mt-1 text-sm font-medium text-on-surface">
              {new Date(reviewedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </section>

      {/* Rejection notice box */}
      {isRejected && (
        <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/70 p-5 text-on-surface">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-2xl text-red-600" aria-hidden="true">
              error
            </span>
            <div>
              <h2 className="font-bold text-red-900">Request not approved</h2>
              {rejectionReason ? (
                <div className="mt-2 text-sm leading-6 text-red-800">
                  <p className="font-semibold">Reason provided:</p>
                  <p className="mt-1 italic">&ldquo;{rejectionReason}&rdquo;</p>
                </div>
              ) : (
                <p className="mt-1 text-sm leading-6 text-red-800">
                  The request could not be verified with the information provided.
                </p>
              )}
              <p className="mt-3 text-xs leading-5 text-red-700">
                If you believe this was an error, please reach out to Cafnet support or submit an
                updated request with additional details.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Approval CTA box */}
      {isApproved && (
        <section className="mt-6 rounded-2xl border border-green-200 bg-green-50/70 p-5 text-on-surface">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined mt-0.5 text-2xl text-green-600" aria-hidden="true">
              check_circle
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-green-900">
                {kind === "claim" ? "Claim verified and approved!" : "Business listing is live!"}
              </h2>
              <p className="mt-1 text-sm leading-6 text-green-800">
                {kind === "claim"
                  ? "You now have management access to this listing. You can update details, manage the menu, and post business updates."
                  : "Your business has been published and is now discoverable by customers across Cafnet."}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {businessId && (
                  <Link
                    href={`/business/dashboard/business/${businessId}`}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
                  >
                    Manage business
                  </Link>
                )}
                {businessId && (
                  <Link
                    href={`/business/${businessId}`}
                    target="_blank"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-[17px]">visibility</span>
                    View public profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pending guidance box */}
      {isPending && (
        <section className="mt-6 rounded-2xl border border-outline-variant bg-surface-container-low p-5">
          <h2 className="font-semibold text-on-surface">What happens next?</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            {kind === "claim"
              ? "Cafnet administrators will verify that you represent this business before management access is granted."
              : "The basic information will be reviewed before the listing becomes public on Cafnet."}
          </p>
        </section>
      )}
    </div>
  );
}

function MissingStatus() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="text-2xl font-bold text-on-surface">Request not found</h1>
      <p className="mt-3 text-sm text-on-surface-variant">
        This business request may no longer be available.
      </p>
      <Link
        href="/business/dashboard"
        className="mt-6 inline-flex text-sm font-semibold text-primary hover:text-[#0f46b8]"
      >
        Business Center <span className="ml-1" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
