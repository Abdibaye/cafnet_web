"use client";

import { useEffect, useState } from "react";
import BusinessReviews from "@/components/BusinessReviews";
import { useCustomerReviews, getCombinedBusinessReviews } from "@/components/CustomerReviewProvider";
import { getReviewSummary } from "@/data/mockReviews";
import ReviewSubmission from "@/components/ReviewSubmission";
import type { MockBusiness } from "@/data/mockBusinesses";
import type { MergedBusinessProfile } from "@/data/businessProfileData";
import * as reviewsApi from "@/lib/api/reviews";
import { reviewToViewModel, reviewSummaryToDistribution } from "@/lib/api/adapters";
import type { CustomerReview } from "@/data/customerReviewStorage";

export default function BusinessReviewSection({ business }: { business: MockBusiness | MergedBusinessProfile }) {
  const { ready, reviews: customerReviews } = useCustomerReviews();
  const [apiReviews, setApiReviews] = useState<CustomerReview[] | null>(null);
  const [apiSummary, setApiSummary] = useState<{ count: number; average: number; distribution: number[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [revList, summary] = await Promise.all([
          reviewsApi.listBusinessReviews(business.id),
          reviewsApi.getReviewSummary(business.id).catch(() => null),
        ]);
        if (!cancelled && revList && revList.length > 0) {
          setApiReviews(revList.map((r) => reviewToViewModel(r)));
          if (summary) {
            setApiSummary(reviewSummaryToDistribution(summary));
          }
        }
      } catch {
        // Fall back to local combined
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  if (!ready) return <p className="text-sm text-on-surface-variant">Loading reviews...</p>;

  const baseReviews = apiReviews ?? getCombinedBusinessReviews(business.id, customerReviews);
  const userAdded = customerReviews.filter(
    (cr) => cr.businessId === business.id && !baseReviews.some((r) => r.id === cr.id),
  );
  const reviews = [...userAdded, ...baseReviews];

  const distribution = apiSummary && !userAdded.length
    ? apiSummary.distribution
    : [5, 4, 3, 2, 1].map((rating) => reviews.filter((review) => review.rating === rating).length);

  const average = apiSummary && !userAdded.length
    ? apiSummary.average
    : reviews.length
      ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
      : 0;

  return (
    <>
      <ReviewSubmission business={business as MockBusiness} />
      <div className="mt-8">
        <BusinessReviews
          reviews={reviews}
          average={average}
          distribution={distribution}
          businessName={business.name}
        />
      </div>
    </>
  );
}

export function BusinessRatingSummary({ businessId }: { businessId: number }) {
  const { ready, reviews } = useCustomerReviews();
  const [apiSummary, setApiSummary] = useState<{ count: number; average: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    reviewsApi
      .getReviewSummary(businessId)
      .then((s) => {
        if (!cancelled && s) setApiSummary({ count: s.count, average: s.average });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!ready) return <span className="text-sm text-on-surface-variant">Loading rating...</span>;

  if (apiSummary && apiSummary.count > 0) {
    return (
      <span className="inline-flex items-center gap-1.5 font-semibold text-secondary">
        <span aria-label={`${apiSummary.average.toFixed(1)} out of 5 stars`}>★★★★★</span>
        <span>{apiSummary.average.toFixed(1)}</span>
        <span className="font-normal text-on-surface-variant">· {apiSummary.count.toLocaleString()} reviews</span>
      </span>
    );
  }

  const seed = getReviewSummary(businessId);
  const customerReviews = reviews.filter((review) => review.businessId === businessId);
  const count = seed.count + customerReviews.length;
  const average = count
    ? Math.round(((seed.average * seed.count + customerReviews.reduce((sum, review) => sum + review.rating, 0)) / count) * 10) / 10
    : 0;

  if (!count) return <span className="font-semibold text-primary">New on Cafnet</span>;
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-secondary">
      <span aria-label={`${average.toFixed(1)} out of 5 stars`}>★★★★★</span>
      <span>{average.toFixed(1)}</span>
      <span className="font-normal text-on-surface-variant">· {count.toLocaleString()} reviews</span>
    </span>
  );
}
