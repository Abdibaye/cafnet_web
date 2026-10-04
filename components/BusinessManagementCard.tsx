import Link from "next/link";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { BusinessClaim, BusinessSubmission } from "@/data/businessOwnerStorage";
import type { BusinessProfileViewModel } from "@/lib/api/adapters";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";

type BusinessManagementCardProps = {
  business?: MockBusiness | BusinessProfileViewModel;
  claim?: BusinessClaim;
  submission?: BusinessSubmission;
  isManaged?: boolean;
};

export default function BusinessManagementCard({
  business,
  claim,
  submission,
  isManaged: propIsManaged,
}: BusinessManagementCardProps) {
  const { isBusinessManaged } = useBusinessOwner();
  const contextManaged = business ? isBusinessManaged?.(business.id) : false;
  const isManaged = propIsManaged ?? Boolean(contextManaged || business?.claimStatus === "claimed");
  const title = business?.name || submission?.businessName || "Business";

  const detailHref =
    isManaged && business
      ? `/business/dashboard/business/${business.id}`
      : claim
      ? `/business/dashboard/claim/${claim.id}`
      : submission
      ? `/business/dashboard/submission/${submission.id}`
      : "/business/dashboard";

  return (
    <article className="flex items-center justify-between gap-4 rounded-2xl border border-outline-variant bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-primary/30">
      <div className="flex min-w-0 items-center gap-4">
        {business && business.images && business.images.length > 0 ? (
          <img
            src={business.images[0]}
            alt=""
            className="size-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-surface-container-low text-outline">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">
              storefront
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-on-surface sm:text-lg">
            {title}
          </h2>
        </div>
      </div>

      <div className="shrink-0">
        <Link
          href={detailHref}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#0f46b8] active:scale-[0.98]"
        >
          Manage business
        </Link>
      </div>
    </article>
  );
}
