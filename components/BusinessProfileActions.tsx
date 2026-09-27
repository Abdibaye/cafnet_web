"use client";

import { useState } from "react";
import RequireAccountPrompt from "@/components/RequireAccountPrompt";

type BusinessProfileActionsProps = {
  businessId: number;
  businessName: string;
  address: string;
  phone?: string;
  hasUpdates: boolean;
};

export default function BusinessProfileActions({ businessId, businessName, address, phone, hasUpdates }: BusinessProfileActionsProps) {
  const [accountAction, setAccountAction] = useState<"save" | "follow" | null>(null);
  const [toast, setToast] = useState("");

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: businessName, text: `Discover ${businessName} on Cafnet`, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setToast("Link copied");
    window.setTimeout(() => setToast(""), 2200);
  };

  const actionButton = (label: string, icon: string, onClick: () => void, primary = false) => (
    <button type="button" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${primary ? "bg-primary text-white hover:bg-[#0f46b8]" : "border border-outline-variant bg-white text-on-surface hover:border-primary/40 hover:text-primary"}`} onClick={onClick}>
      <span className="material-symbols-outlined text-[19px]" aria-hidden="true">{icon}</span>{label}
    </button>
  );

  return <>
    <div className="flex flex-wrap gap-2">
      {actionButton("Get directions", "directions", () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank", "noopener,noreferrer"), true)}
      {phone && actionButton("Call", "call", () => window.open(`tel:${phone.replaceAll(" ", "")}`, "_self"))}
      {actionButton("Save", "bookmark_border", () => setAccountAction("save"))}
      {actionButton("Share", "share", () => { void share(); })}
    </div>
    {hasUpdates && <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-[#0f46b8]" onClick={() => setAccountAction("follow")}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">notifications_none</span>Follow updates</button>}
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-outline-variant bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(20,33,61,0.08)] backdrop-blur lg:hidden"><div className="mx-auto flex h-16 max-w-lg items-center justify-around gap-2 px-3"><button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-primary" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank", "noopener,noreferrer")}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">directions</span>Directions</button>{phone && <a href={`tel:${phone.replaceAll(" ", "")}`} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant"><span className="material-symbols-outlined text-[21px]" aria-hidden="true">call</span>Call</a>}<button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant" onClick={() => setAccountAction("save")}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">bookmark_border</span>Save</button><button type="button" className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-on-surface-variant" onClick={() => { void share(); }}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">share</span>Share</button></div></div>
    {accountAction && <RequireAccountPrompt action={accountAction} onClose={() => setAccountAction(null)} />}
    {toast && <div className="fixed bottom-20 left-1/2 z-[65] -translate-x-1/2 rounded-lg bg-on-surface px-4 py-2.5 text-sm font-semibold text-white shadow-lg lg:bottom-6" role="status">{toast}</div>}
    <span className="sr-only">Profile actions for business {businessId}</span>
  </>;
}