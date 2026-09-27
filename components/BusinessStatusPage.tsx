"use client";

import Link from "next/link";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { getBusinessById } from "@/data/mockBusinesses";

type BusinessStatusPageProps = { kind: "claim" | "submission"; claimId?: string; submissionId?: string };

export default function BusinessStatusPage({ kind, claimId, submissionId }: BusinessStatusPageProps) {
  const { ready, claims, submissions } = useBusinessOwner();
  if (!ready) return <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-on-surface-variant">Loading request...</div>;
  const claim = claims.find((item) => item.id === claimId);
  const submission = submissions.find((item) => item.id === submissionId);
  const business = claim ? getBusinessById(claim.businessId) : undefined;
  if (kind === "claim" && !claim) return <MissingStatus />;
  if (kind === "submission" && !submission) return <MissingStatus />;
  const submittedAt = (claim || submission)?.submittedAt;

  return <div className="mx-auto max-w-2xl px-5 py-10 lg:px-0 lg:py-16"><Link href="/business/dashboard" className="text-sm font-semibold text-primary">← Business Center</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business Center</p><h1 className="mt-3 text-3xl font-bold text-on-surface">{kind === "claim" ? "Claim request" : "Business submission"}</h1><section className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white"><div className="p-5"><p className="text-xs text-on-surface-variant">Business</p><p className="mt-1 text-lg font-bold text-on-surface">{business?.name || submission?.businessName}</p>{business && <p className="mt-1 text-sm text-on-surface-variant">{business.location}</p>}</div>{submission && <><div className="p-5"><p className="text-xs text-on-surface-variant">Category</p><p className="mt-1 font-semibold text-on-surface">{submission.category === "cafe" ? "Café" : submission.category === "drinks" ? "Drinks & More" : "Restaurant"}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Area</p><p className="mt-1 font-semibold text-on-surface">{submission.area}</p></div></>}<div className="p-5"><p className="text-xs text-on-surface-variant">Status</p><p className="mt-1 inline-flex items-center gap-2 font-semibold text-on-surface"><span className="material-symbols-outlined text-secondary" aria-hidden="true">schedule</span>{kind === "claim" ? "Pending verification" : "Pending review"}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Submitted</p><p className="mt-1 font-semibold text-on-surface">{submittedAt ? new Date(submittedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Unknown"}</p></div></section><section className="mt-6 border border-outline-variant bg-surface-container-low p-5"><h2 className="font-semibold text-on-surface">What happens next?</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">{kind === "claim" ? "Cafnet will verify that you represent this business before management access is provided." : "The basic information will be reviewed before the listing becomes public."}</p></section></div>;
}

function MissingStatus() {
  return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Request not found</h1><p className="mt-3 text-sm text-on-surface-variant">This business request may no longer be available.</p><Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">Business Center <span className="ml-1" aria-hidden="true">→</span></Link></div>;
}
