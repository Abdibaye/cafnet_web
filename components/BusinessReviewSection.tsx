"use client";

import BusinessReviews from "@/components/BusinessReviews";
import { useCustomerReviews, getCombinedBusinessReviews } from "@/components/CustomerReviewProvider";
import { getReviewSummary } from "@/data/mockReviews";
import ReviewSubmission from "@/components/ReviewSubmission";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { MergedBusinessProfile } from "@/data/businessProfileData";

export default function BusinessReviewSection({ business }: { business: MockBusiness | MergedBusinessProfile }) {
  const { ready, reviews: customerReviews } = useCustomerReviews();
  if (!ready) return <p className="text-sm text-on-surface-variant">Loading reviews...</p>;
  const reviews = getCombinedBusinessReviews(business.id, customerReviews);
  const distribution = [5, 4, 3, 2, 1].map((rating) => reviews.filter((review) => review.rating === rating).length);
  const average = reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0;
  return <><ReviewSubmission business={business as MockBusiness} /><div className="mt-8"><BusinessReviews reviews={reviews} average={average} distribution={distribution} /></div></>;
}

export function BusinessRatingSummary({ businessId }: { businessId: number }) {
  const { ready, reviews } = useCustomerReviews();
  if (!ready) return <span className="text-sm text-on-surface-variant">Loading rating...</span>;
  const seed = getReviewSummary(businessId);
  const customerReviews = reviews.filter((review) => review.businessId === businessId);
  const count = seed.count + customerReviews.length;
  const average = count ? Math.round(((seed.average * seed.count + customerReviews.reduce((sum, review) => sum + review.rating, 0)) / count) * 10) / 10 : 0;
  if (!count) return <span className="font-semibold text-primary">New on Cafnet</span>;
  return <span className="inline-flex items-center gap-1.5 font-semibold text-secondary"><span aria-label={`${average.toFixed(1)} out of 5 stars`}>★★★★★</span><span>{average.toFixed(1)}</span><span className="font-normal text-on-surface-variant">· {count.toLocaleString()} reviews</span></span>;
}
