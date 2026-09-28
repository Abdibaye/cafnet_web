"use client";

import { useCustomer } from "@/components/CustomerProvider";

type BusinessProfileActionsProps = {
  businessId: number;
  businessName: string;
  address: string;
  phone?: string;
  hasUpdates: boolean;
  reservationAvailable: boolean;
};

export default function BusinessProfileActions({ businessId, businessName, address, phone, hasUpdates, reservationAvailable }: BusinessProfileActionsProps) {
  const { isSaved, isFollowing, requestAction, showToast } = useCustomer();
  const saved = isSaved(businessId);
  const following = isFollowing(businessId);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, text: `Discover ${businessName} on Cafnet`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  };

  const actionButton = (label: string, icon: string, onClick: () => void, primary = false) => (
    <button type="button" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${primary ? "bg-primary text-white hover:bg-[#0f46b8]" : "border border-outline-variant bg-white text-on-surface hover:border-primary/40 hover:text-primary"}`} onClick={onClick}>
      <span className="material-symbols-outlined text-[19px]" aria-hidden="true">{icon}</span>{label}
    </button>
  );

  return <>
    <div className="flex flex-wrap gap-2">
      {reservationAvailable && <a href={`/reserve/${businessId}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><span className="material-symbols-outlined text-[19px]" aria-hidden="true">event_available</span>Reserve a table</a>}
      {actionButton("Get directions", "directions", () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank", "noopener,noreferrer"), true)}
      {phone && actionButton("Call", "call", () => window.open(`tel:${phone.replaceAll(" ", "")}`, "_self"))}
      {actionButton(saved ? "Saved" : "Save", saved ? "bookmark" : "bookmark_border", () => requestAction("save", businessId))}
      {actionButton("Share", "share", () => { void share(); })}
    </div>
    {hasUpdates && <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]" onClick={() => requestAction("follow", businessId)}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">notifications_none</span>{following ? "Following" : "Follow updates"}</button>}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(20,33,61,0.08)] backdrop-blur lg:hidden"><div className="mx-auto flex h-16 max-w-lg items-center justify-around gap-2 px-3"><button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank", "noopener,noreferrer")}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">directions</span>Directions</button>{phone && <a href={`tel:${phone.replaceAll(" ", "")}`} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant"><span className="material-symbols-outlined text-[21px]" aria-hidden="true">call</span>Call</a>}<button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant" onClick={() => requestAction("save", businessId)}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">{saved ? "bookmark" : "bookmark_border"}</span>{saved ? "Saved" : "Save"}</button><button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant" onClick={() => { void share(); }}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">share</span>Share</button></div></div>
    <span className="sr-only">Profile actions for business {businessId}</span>
  </>;
}