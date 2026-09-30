"use client";

import Link from "next/link";
import { useState } from "react";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";
import type { BusinessSubmission } from "@/data/businessOwnerStorage";

const categories: { value: BusinessSubmission["category"]; label: string }[] = [{ value: "restaurant", label: "Restaurant" }, { value: "cafe", label: "Café" }, { value: "drinks", label: "Drinks & More" }];

export default function BusinessAddFlow() {
  const { ready, submissions, submitBusiness } = useBusinessOwner();
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<BusinessSubmission["category"]>("restaurant");
  const [area, setArea] = useState("");
  const [step, setStep] = useState<"form" | "preview" | "submitted">("form");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const continueToPreview = () => {
    if (!businessName.trim() || !category || !area.trim()) {
      setError("Please complete the business name, category, and area.");
      return;
    }
    setError("");
    setSubmitError("");
    setStep("preview");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await submitBusiness(businessName.trim(), category, area.trim());
      setStep("submitted");
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit business. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return <div className="mx-auto max-w-2xl px-5 py-20 text-sm text-on-surface-variant">Loading...</div>;
  if (step === "form" && submissions.length > 0) return <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20"><Link href="/business" className="text-sm font-semibold text-primary">← For businesses</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">New listing</p><h1 className="mt-3 text-3xl font-bold text-on-surface">Business submission pending</h1><p className="mt-4 text-sm leading-6 text-on-surface-variant">Your request to add <strong className="text-on-surface">{submissions[0].businessName}</strong> is already being reviewed.</p><div className="mt-8 border border-outline-variant bg-white p-5"><p className="font-semibold text-on-surface">Pending review</p><p className="mt-2 text-sm leading-6 text-on-surface-variant">The listing will not become public until it has been reviewed.</p></div><Link href="/explore" className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]">Back to Cafnet</Link></div>;
  if (step === "submitted") return <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">For businesses</p><h1 className="mt-3 text-3xl font-bold text-on-surface">Business submitted</h1><p className="mt-4 text-sm leading-6 text-on-surface-variant">Your business has been submitted for review.</p><div className="mt-8 border border-outline-variant bg-white p-5"><p className="font-semibold text-on-surface">Pending review</p><p className="mt-2 text-sm leading-6 text-on-surface-variant">We&apos;ll review the basic listing information before it becomes public.</p></div><Link href="/business/dashboard" className="mt-8 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]">View Business Center</Link></div>;
  if (step === "preview") return <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20"><button type="button" className="text-sm font-semibold text-primary" onClick={() => setStep("form")}>← Edit details</button><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Review details</p><h1 className="mt-3 text-3xl font-bold text-on-surface">Your business</h1><div className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white"><div className="p-5"><p className="text-xs text-on-surface-variant">Business name</p><p className="mt-1 font-semibold text-on-surface">{businessName.trim()}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Category</p><p className="mt-1 font-semibold text-on-surface">{categories.find((item) => item.value === category)?.label}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Area</p><p className="mt-1 font-semibold text-on-surface">{area.trim()}</p></div></div>{submitError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">{submitError}</div>}<button type="button" disabled={submitting} className="mt-7 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#0f46b8]" onClick={handleSubmit}>{submitting ? "Submitting..." : "Submit for review"}</button></div>;

  return <div className="mx-auto max-w-2xl px-5 py-12 lg:py-20"><Link href="/business" className="text-sm font-semibold text-primary">← For businesses</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">New listing</p><h1 className="mt-3 text-3xl font-bold text-on-surface">Add your business</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant">Can&apos;t find your business on Cafnet? Submit the basic information needed to create your listing.</p><div className="mt-8 space-y-5"><div><label htmlFor="new-business-name" className="block text-sm font-semibold text-on-surface">Business name</label><input id="new-business-name" className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={businessName} onChange={(event) => setBusinessName(event.target.value)} /></div><div><label htmlFor="new-business-category" className="block text-sm font-semibold text-on-surface">Category</label><select id="new-business-category" className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" value={category} onChange={(event) => setCategory(event.target.value as BusinessSubmission["category"])}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></div><div><label htmlFor="new-business-area" className="block text-sm font-semibold text-on-surface">Neighborhood / area</label><input id="new-business-area" className="mt-2 h-12 w-full rounded-xl border border-outline-variant bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="For example, Bole" value={area} onChange={(event) => setArea(event.target.value)} /></div>{error && <p className="text-sm font-semibold text-secondary" role="alert">{error}</p>}<button type="button" className="h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={continueToPreview}>Continue</button></div></div>;
}
