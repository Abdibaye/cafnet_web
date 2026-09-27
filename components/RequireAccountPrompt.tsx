"use client";

type RequireAccountPromptProps = {
  action: "save" | "follow";
  onClose: () => void;
};

export default function RequireAccountPrompt({ action, onClose }: RequireAccountPromptProps) {
  const noun = action === "save" ? "places you love" : "your favorite places";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-on-surface/30 p-4 sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(20,33,61,0.18)]" role="dialog" aria-modal="true" aria-labelledby="account-prompt-title">
        <div className="flex items-start justify-between gap-4">
          <div><h2 id="account-prompt-title" className="text-xl font-bold text-on-surface">Save {noun}.</h2><p className="mt-2 text-sm leading-6 text-on-surface-variant">Create a free Cafnet account to keep {noun} in one place.</p></div>
          <button type="button" className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" aria-label="Close account prompt" onClick={onClose}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
        </div>
        <button type="button" className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={onClose}>Continue with phone</button>
        <button type="button" className="mt-2 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" onClick={onClose}>Not now</button>
      </section>
    </div>
  );
}