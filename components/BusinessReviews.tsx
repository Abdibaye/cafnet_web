"use client";

import { useState } from "react";
import type { MockReview } from "@/data/mockReviews";

type SortOption = "relevant" | "newest" | "highest" | "lowest";

type BusinessReviewsProps = {
  reviews: MockReview[];
  average: number;
  distribution: number[];
};

const sortLabels: Record<SortOption, string> = { relevant: "Most relevant", newest: "Newest", highest: "Highest rated", lowest: "Lowest rated" };

export default function BusinessReviews({ reviews, average, distribution }: BusinessReviewsProps) {
  const [sort, setSort] = useState<SortOption>("relevant");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [helpful, setHelpful] = useState<string[]>([]);
  const maxCount = Math.max(...distribution, 1);
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sort === "newest") return b.id.localeCompare(a.id);
    if (sort === "highest") return b.rating - a.rating || b.id.localeCompare(a.id);
    if (sort === "lowest") return a.rating - b.rating || b.id.localeCompare(a.id);
    return b.helpfulCount - a.helpfulCount || b.id.localeCompare(a.id);
  });

  if (reviews.length === 0) return <div className="border border-dashed border-outline-variant bg-surface-container-low px-5 py-8 text-sm text-on-surface-variant"><p className="font-semibold text-on-surface">No reviews yet</p><p className="mt-2">Be one of the first people to share your experience.</p></div>;

  return <div>
    <div className="mb-8 grid gap-8 border-b border-outline-variant pb-8 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center">
      <div><p className="text-4xl font-bold text-on-surface">{average.toFixed(1)}</p><p className="mt-1 text-sm tracking-[0.12em] text-secondary" aria-label={`${average.toFixed(1)} out of 5 stars`}>★★★★★</p><p className="mt-1 text-sm text-on-surface-variant">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p></div>
      <div className="space-y-2" aria-label="Rating distribution">{distribution.map((count, index) => { const rating = 5 - index; return <div key={rating} className="flex items-center gap-3 text-xs text-on-surface-variant"><span className="w-6 shrink-0">{rating} ★</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container"><div className="h-full rounded-full bg-secondary" style={{ width: `${(count / maxCount) * 100}%` }} /></div><span className="w-5 text-right">{count}</span></div>; })}</div>
    </div>
    <div className="mb-2 flex items-center justify-between gap-3"><h3 className="text-base font-bold text-on-surface">Customer experiences</h3><label className="flex items-center gap-2 text-xs text-on-surface-variant">Sort by<select aria-label="Sort reviews" className="rounded-lg border border-outline-variant bg-white px-2 py-2 text-xs font-semibold text-on-surface outline-none focus:border-primary" value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>{Object.entries(sortLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <div className="divide-y divide-outline-variant">{sortedReviews.map((review) => { const isExpanded = expanded.includes(review.id); const isHelpful = helpful.includes(review.id); const isLong = review.text.length > 130; return <article key={review.id} className="py-6 first:pt-4"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container font-semibold text-primary" aria-hidden="true">{review.userAvatar}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><div><h4 className="text-sm font-semibold text-on-surface">{review.userName}</h4><p className="mt-1 text-sm tracking-[0.12em] text-secondary" aria-label={`${review.rating} out of 5 stars`}>★★★★★ <span className="sr-only">{review.rating} out of 5 stars</span></p></div><time className="text-xs text-on-surface-variant">{review.date}</time></div><p className={`mt-3 text-sm leading-6 text-on-surface-variant ${!isExpanded && isLong ? "line-clamp-2" : ""}`}>{review.text}</p>{isLong && <button type="button" className="mt-1 text-xs font-semibold text-primary hover:text-[#0f46b8]" onClick={() => setExpanded((current) => current.includes(review.id) ? current.filter((id) => id !== review.id) : [...current, review.id])}>{isExpanded ? "Show less" : "Read more"}</button>}<div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant"><button type="button" className={`font-semibold ${isHelpful ? "text-primary" : "hover:text-primary"}`} onClick={() => setHelpful((current) => current.includes(review.id) ? current.filter((id) => id !== review.id) : [...current, review.id])}>Helpful · {review.helpfulCount + (isHelpful ? 1 : 0)}</button>{review.verifiedVisit && <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">verified</span>Verified visit</span>}</div></div></div></article>; })}</div>
  </div>;
}
