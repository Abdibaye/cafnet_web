"use client";

import Link from "next/link";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import { getBusinessById } from "@/data/mockBusinesses";
import { getManagedBusiness as getManagedBusinessFromStorage, getEditableData as getEditableDataFromStorage } from "@/data/ownerManagedBusinessStorage";
import { getUpdatesByBusiness } from "@/data/businessUpdateStorage";

export default function ManagedBusinessPage({ businessId }: { businessId: string }) {
  const business = getBusinessById(businessId);
  const { ready, getManagedBusiness: getManagedFromContext } = useBusinessOwner();
  
  const managedBusiness = getManagedFromContext?.(Number(businessId)) || getManagedBusinessFromStorage(Number(businessId));
  const editableData = getEditableDataFromStorage(Number(businessId));

  if (!business) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Business not found</h1><p className="mt-3 text-sm text-on-surface-variant">This business may no longer be available.</p><Link href="/business/dashboard" className="mt-6 inline-flex text-sm font-semibold text-primary">Business Center</Link></div>;

  const lastUpdated = managedBusiness?.editableData.updatedAt ? new Date(managedBusiness.editableData.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : undefined;
  const updates = getUpdatesByBusiness(Number(businessId));
  const activeUpdatesCount = updates.filter((u) => u.status === "published").length;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 lg:px-0 lg:py-16">
      <Link href="/business/dashboard" className="text-sm font-semibold text-primary">← Business Center</Link>
      
      <div className="mt-8 flex flex-col gap-5 border-b border-outline-variant pb-7 sm:flex-row sm:items-center">
        <img src={business.images[0]} alt="" className="size-24 rounded-xl object-cover" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Managed by you</p>
          <h1 className="mt-2 text-3xl font-bold text-on-surface">{business.name}</h1>
          <p className="mt-2 text-sm text-on-surface-variant">{business.cuisine} · {business.location}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/business/${business.id}`} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]">
          View public profile
        </Link>
        <Link href={`/business/dashboard/business/${business.id}/edit`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">edit</span>
          Edit listing
        </Link>
        <Link href={`/business/dashboard/business/${business.id}/updates`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary">
          <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">campaign</span>
          Manage updates
          {activeUpdatesCount > 0 && <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">{activeUpdatesCount}</span>}
        </Link>
        {lastUpdated && (
          <span className="inline-flex h-11 items-center gap-2 rounded-xl border border-outline-variant px-4 text-sm font-semibold text-on-surface">
            <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">schedule</span>
            Updated {lastUpdated}
          </span>
        )}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-on-surface">Your listing</h2>
        <p className="mt-2 text-sm text-on-surface-variant">Manage the information customers see about your business</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Basic information</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Name, description, and category</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">check_circle</span>
            </div>
          </article>
          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Contact & location</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Phone, address, website, and price range</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">check_circle</span>
            </div>
          </article>
          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Opening hours</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Set your regular business hours</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">check_circle</span>
            </div>
          </article>
          <article className="border border-outline-variant bg-white p-5">
            <h3 className="font-semibold text-on-surface">Features</h3>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">Customer-facing attributes and tags</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant">Editable</span>
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">check_circle</span>
            </div>
          </article>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-on-surface">Customer information</h3>
          <p className="mt-2 text-sm text-on-surface-variant">The following information is managed by Cafnet and cannot be edited:</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
              <div>
                <p className="font-semibold text-on-surface">Rating & reviews</p>
                <p className="text-sm text-on-surface-variant">{business.rating} · {business.reviewCount} reviews</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">lock</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-white p-4">
              <div>
                <p className="font-semibold text-on-surface">Verified status</p>
                <p className="text-sm text-on-surface-variant">{business.verified ? "Verified" : "Not verified"}</p>
              </div>
              <span className="material-symbols-outlined text-[18px] text-secondary" aria-hidden="true">lock</span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-on-surface">Updates</h3>
          <p className="mt-2 text-sm text-on-surface-variant">Share new menus, offers, events, and announcements with customers.</p>
          <div className="mt-4">
            <Link
              href={`/business/dashboard/business/${business.id}/updates`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-4 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">campaign</span>
              Manage updates
              {activeUpdatesCount > 0 && <span className="ml-1 rounded-full bg-primary-container px-2 py-0.5 text-xs font-semibold text-primary">{activeUpdatesCount} active</span>}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
