import Link from "next/link";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { BusinessClaim, BusinessSubmission } from "@/data/businessOwnerStorage";
import { getManagedBusiness as getManagedBusinessFromStorage } from "@/data/ownerManagedBusinessStorage";
import { getPendingReservationsCount } from "@/data/reservationStorage";

type BusinessManagementCardProps = {
  business?: MockBusiness;
  claim?: BusinessClaim;
  submission?: BusinessSubmission;
};

function categoryLabel(category: MockBusiness["category"] | BusinessSubmission["category"]) {
  return category === "cafe" ? "Café" : category === "drinks" ? "Drinks & More" : "Restaurant";
}

export default function BusinessManagementCard({ business, claim, submission }: BusinessManagementCardProps) {
  const managedBusiness = business ? getManagedBusinessFromStorage(business.id) : undefined;
  const isManaged = Boolean(business?.claimStatus === "claimed" || managedBusiness);
  const title = business?.name || submission?.businessName || "Business submission";
  const category = business ? categoryLabel(business.category) : submission ? categoryLabel(submission.category) : "Business";
  const area = business?.location || submission?.area || "Area pending";

  const isRejected = (claim && claim.status === "rejected") || (submission && submission.status === "rejected");
  const isApprovedClaim = claim && claim.status === "approved";
  const isApprovedSub = submission && submission.status === "approved";

  const status = isManaged
    ? "Managed by you"
    : isApprovedClaim || isApprovedSub
    ? "Approved"
    : isRejected
    ? "Not approved"
    : claim
    ? "Pending verification"
    : "Pending review";

  const statusIcon = isManaged || isApprovedClaim || isApprovedSub
    ? "check_circle"
    : isRejected
    ? "cancel"
    : "schedule";

  const statusColor = isManaged || isApprovedClaim || isApprovedSub
    ? "text-primary"
    : isRejected
    ? "text-red-600"
    : "text-secondary";

  const explanation = isManaged
    ? "You have management access to this listing."
    : isApprovedClaim
    ? "Your claim has been approved."
    : isApprovedSub
    ? "Your business has been approved and published."
    : isRejected
    ? "Your request was not approved. Click to view the reason."
    : claim
    ? "Your claim request is waiting for verification."
    : "Your business information is waiting for review.";

  const detailHref = isManaged && business ? `/business/dashboard/business/${business.id}` : claim ? `/business/dashboard/claim/${claim.id}` : `/business/dashboard/submission/${submission?.id}`;
  const profileHref = business ? `/business/${business.id}` : "/business";

  const lastUpdated = managedBusiness?.editableData.updatedAt ? new Date(managedBusiness.editableData.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : undefined;
  const isReservable = Boolean(isManaged && business && business.reservationAvailable);
  const pendingReservations = isReservable ? getPendingReservationsCount(business!.id) : 0;

  return <article className="flex flex-col gap-5 border border-outline-variant bg-white p-5 sm:flex-row sm:items-center">
    <div className="flex min-w-0 flex-1 items-center gap-4">
      {business ? <img src={business.images[0]} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface-container-low"><span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">storefront</span></div>}
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-on-surface">{title}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{category} · {area}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className={`inline-flex items-center gap-1.5 text-sm font-semibold ${statusColor}`}>
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{statusIcon}</span>
            {status}
          </p>
          {isReservable && (
            pendingReservations > 0 ? (
              <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-xs font-bold text-amber-800">
                Reservations: {pendingReservations} {pendingReservations === 1 ? "request" : "requests"} waiting for your response
              </span>
            ) : (
              <span className="text-xs text-on-surface-variant">
                Reservations: No pending reservation requests.
              </span>
            )
          )}
        </div>
        {isManaged && lastUpdated && <p className="mt-1 text-xs leading-5 text-on-surface-variant">Last updated {lastUpdated}</p>}
        <p className="mt-1 text-xs leading-5 text-on-surface-variant">{explanation}</p>
      </div>
    </div>
    <div className="flex shrink-0 flex-wrap gap-3 sm:flex-col sm:items-stretch">
      <Link href={profileHref} className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary">
        View business
      </Link>
      {isReservable && business && (
        <Link
          href={`/business/dashboard/business/${business.id}/reservations`}
          className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition-colors ${pendingReservations > 0 ? "border-amber-300 bg-amber-50 text-amber-900 font-bold hover:bg-amber-100" : "border-outline-variant text-on-surface hover:border-primary/40 hover:text-primary"}`}
        >
          <span className="material-symbols-outlined text-[17px] text-primary" aria-hidden="true">event_seat</span>
          {pendingReservations > 0 ? `Manage reservations (${pendingReservations})` : "View reservations"}
        </Link>
      )}
      {detailHref && <Link href={detailHref} className="inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-primary hover:bg-primary-container">
        {isManaged ? "Manage business" : claim ? "View request" : "View submission"}
      </Link>}
    </div>
  </article>;
}
