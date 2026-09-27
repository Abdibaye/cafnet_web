"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useCustomerReviews } from "@/components/CustomerReviewProvider";
import { getBusinessById } from "@/data/mockBusinesses";

export default function CustomerReviewsPage() {
  const { authReady, isAuthenticated, startSignIn } = useCustomer();
  const { ready, reviews } = useCustomerReviews();
  if (!authReady || !ready) return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">Loading reviews...</div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Sign in to see your reviews</h1><p className="mt-3 text-sm text-on-surface-variant">Reviews you post on Cafnet will appear here.</p><button type="button" className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white" onClick={startSignIn}>Sign in</button></div>;
  return <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Your Cafnet</p><h1 className="mt-2 text-3xl font-bold text-on-surface">My reviews</h1>{reviews.length === 0 ? <div className="mt-10 border border-dashed border-outline-variant bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold text-on-surface">No reviews yet.</h2><p className="mt-3 text-sm text-on-surface-variant">After a visit, share your experience to help others decide where to eat.</p><Link href="/explore" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Explore places</Link></div> : <div className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white">{reviews.map((review) => { const business = getBusinessById(review.businessId); return <article key={review.id} className="p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-on-surface">{business?.name || "Business"}</h2><p className="mt-1 text-sm tracking-[0.12em] text-secondary" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p></div><time className="text-xs text-on-surface-variant">{review.date}</time></div>{review.text && <p className="mt-3 text-sm leading-6 text-on-surface-variant">{review.text}</p>}<div className="mt-3 flex flex-wrap items-center gap-4"><span className="inline-flex items-center gap-1 text-xs font-semibold text-primary"><span className="material-symbols-outlined text-[15px]" aria-hidden="true">verified</span>Verified visit</span><Link href={`/business/${review.businessId}#reviews`} className="text-xs font-semibold text-primary">View</Link></div></article>; })}</div>}</div>;
}
