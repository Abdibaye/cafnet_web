"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import BusinessManagementCard from "@/components/BusinessManagementCard";
import { mockBusinesses } from "@/data/mockBusinesses";

export default function BusinessCenterPage() {
  const { authReady, isAuthenticated, startSignIn } = useCustomer();
  const { ready, claims, submissions } = useBusinessOwner();
  const managedBusinesses = mockBusinesses.filter((business) => business.claimStatus === "claimed");

  if (!authReady || !ready) return <div className="mx-auto max-w-4xl px-5 py-20 text-sm text-on-surface-variant">Loading Business Center...</div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Sign in to manage your businesses</h1><p className="mt-3 text-sm text-on-surface-variant">Use your Cafnet account to view claims and business submissions.</p><button type="button" className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={startSignIn}>Sign in</button></div>;

  const hasBusinesses = managedBusinesses.length > 0 || claims.length > 0 || submissions.length > 0;
  return <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16"><div className="border-b border-outline-variant pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business Center</p><h1 className="mt-2 text-3xl font-bold text-on-surface">Your businesses</h1><nav className="mt-6 flex gap-6" aria-label="Business navigation"><Link href="/business/dashboard" className="border-b-2 border-primary pb-3 text-sm font-semibold text-primary">Overview</Link><Link href="#businesses" className="pb-3 text-sm font-semibold text-on-surface-variant hover:text-primary">Businesses</Link></nav></div>{hasBusinesses ? <><div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-on-surface-variant"><span>{managedBusinesses.length + claims.length + submissions.length} {managedBusinesses.length + claims.length + submissions.length === 1 ? "business" : "businesses"}</span>{claims.length > 0 && <span>· {claims.length} pending verification</span>}{managedBusinesses.length > 0 && <span>· {managedBusinesses.length} managed</span>}</div><section id="businesses" className="mt-5 space-y-4">{managedBusinesses.map((business) => <BusinessManagementCard key={`managed-${business.id}`} business={business} />)}{claims.map((claim) => { const business = mockBusinesses.find((item) => item.id === claim.businessId); return <BusinessManagementCard key={claim.id} business={business} claim={claim} />; })}{submissions.map((submission) => <BusinessManagementCard key={submission.id} submission={submission} />)}</section></> : <section className="mt-12 border border-dashed border-outline-variant bg-white px-6 py-12 text-center"><span className="material-symbols-outlined text-3xl text-outline" aria-hidden="true">storefront</span><h2 className="mt-4 text-lg font-bold text-on-surface">You don&apos;t have any businesses yet.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">Add your business to start managing your presence on Cafnet.</p><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/business/claim" className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]">Find my business</Link><Link href="/business/add" className="inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold text-primary hover:bg-primary-container">Add your business</Link></div></section>}</div>;
}
