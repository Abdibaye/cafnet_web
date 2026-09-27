import Link from "next/link";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { BusinessClaim, BusinessSubmission } from "@/data/businessOwnerStorage";

type BusinessManagementCardProps = {
  business?: MockBusiness;
  claim?: BusinessClaim;
  submission?: BusinessSubmission;
};

function categoryLabel(category: MockBusiness["category"] | BusinessSubmission["category"]) {
  return category === "cafe" ? "Café" : category === "drinks" ? "Drinks & More" : "Restaurant";
}

export default function BusinessManagementCard({ business, claim, submission }: BusinessManagementCardProps) {
  const isManaged = business?.claimStatus === "claimed";
  const title = business?.name || submission?.businessName || "Business submission";
  const category = business ? categoryLabel(business.category) : submission ? categoryLabel(submission.category) : "Business";
  const area = business?.location || submission?.area || "Area pending";
  const status = isManaged ? "Managed by you" : claim ? "Pending verification" : "Pending review";
  const explanation = isManaged ? "You have management access to this listing." : claim ? "Your claim request is waiting for verification." : "Your business information is waiting for review.";
  const detailHref = isManaged && business ? `/business/dashboard/business/${business.id}` : claim ? `/business/dashboard/claim/${claim.id}` : `/business/dashboard/submission/${submission?.id}`;
  const profileHref = business ? `/business/${business.id}` : "/business";

  return <article className="flex flex-col gap-5 border border-outline-variant bg-white p-5 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-4">{business ? <img src={business.images[0]} alt="" className="size-20 shrink-0 rounded-xl object-cover" /> : <div className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-surface-container-low"><span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">storefront</span></div>}<div className="min-w-0"><h2 className="truncate text-base font-bold text-on-surface">{title}</h2><p className="mt-1 text-sm text-on-surface-variant">{category} · {area}</p><p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-on-surface"><span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">{isManaged ? "check_circle" : "schedule"}</span>{status}</p><p className="mt-1 text-xs leading-5 text-on-surface-variant">{explanation}</p></div></div><div className="flex shrink-0 flex-wrap gap-3 sm:flex-col sm:items-stretch"><Link href={profileHref} className="inline-flex h-10 items-center justify-center rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary">View business</Link>{detailHref && <Link href={detailHref} className="inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-primary hover:bg-primary-container">{isManaged ? "Manage business" : claim ? "View request" : "View submission"}</Link>}</div></article>;
}
