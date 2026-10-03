"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LOCATIONS = [
  { label: "Bole",      icon: "location_on" },
  { label: "Kazanchis", icon: "location_on" },
  { label: "Piassa",    icon: "location_on" },
  { label: "Merkato",   icon: "location_on" },
];

export default function SplitSearchBar() {
  const router = useRouter();

  const [what, setWhat]               = useState("");
  const [where, setWhere]             = useState("Bole");
  const [whatFocused, setWhatFocused] = useState(false);
  const [whereOpen, setWhereOpen]     = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const whereInputRef = useRef<HTMLInputElement>(null);

  /* ── close on outside click / Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhereOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setWhereOpen(false);
        setWhatFocused(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const anyFocused = whatFocused || whereOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q   = what.trim();
    const loc = where.trim();
    if (!q && !loc) return;
    const params = new URLSearchParams();
    if (q)   params.set("q", q);
    if (loc) params.set("location", loc);
    router.push(`/search?${params.toString()}`);
  };

  const selectLocation = (label: string) => {
    setWhere(label);
    setWhereOpen(false);
    whereInputRef.current?.blur();
  };

  return (
    <section className="px-5 pt-5 pb-0 lg:px-12">
      <div ref={containerRef} className="mx-auto max-w-7xl">

        {/* ─── DESKTOP ───────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className={`hidden md:flex items-stretch overflow-hidden rounded-full bg-white border transition-all duration-200 shadow-sm ${
            anyFocused
              ? "border-primary/40 ring-2 ring-primary/20 shadow-md"
              : "border-outline-variant"
          }`}
        >
          {/* What */}
          <div className="flex flex-1 items-center min-w-0 px-5 py-3.5 gap-3">
            <span
              className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                whatFocused ? "text-primary" : "text-outline"
              }`}
              aria-hidden="true"
            >
              search
            </span>
            <input
              className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface outline-none focus:ring-0 placeholder:text-outline placeholder:font-normal"
              placeholder="Restaurant, cuisine, café or place..."
              type="text"
              value={what}
              onChange={(e) => setWhat(e.target.value)}
              onFocus={() => setWhatFocused(true)}
              onBlur={() => setWhatFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(e as unknown as React.FormEvent); }}
            />
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-outline-variant" aria-hidden="true" />

          {/* Where – dropdown wrapper */}
          <div className="relative shrink-0">
            <div
              className={`flex items-center gap-2.5 px-5 py-3.5 cursor-pointer min-w-[160px] transition-colors ${
                whereOpen ? "bg-surface-container-low" : ""
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                  whereOpen ? "text-primary" : "text-outline"
                }`}
                aria-hidden="true"
              >
                location_on
              </span>
              <input
                ref={whereInputRef}
                className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface outline-none focus:ring-0 placeholder:text-outline placeholder:font-normal cursor-pointer"
                placeholder="Neighbourhood or city..."
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onFocus={() => setWhereOpen(true)}
                readOnly
              />
              <span
                className={`material-symbols-outlined text-[18px] shrink-0 text-outline transition-transform duration-200 ${
                  whereOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                expand_more
              </span>
            </div>

            {/* Location dropdown */}
            {whereOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-xl">
                {/* Auto-detect */}
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-primary transition-colors hover:bg-primary-container focus-visible:outline-none"
                  onClick={() => selectLocation("Current location")}
                >
                  <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                    my_location
                  </span>
                  Use current location
                </button>

                <div className="mx-4 border-t border-outline-variant" />

                <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
                  Popular areas
                </p>

                {LOCATIONS.map((loc) => (
                  <button
                    key={loc.label}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary focus-visible:outline-none"
                    onClick={() => selectLocation(loc.label)}
                  >
                    <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">
                      {loc.icon}
                    </span>
                    {loc.label}
                  </button>
                ))}

                <div className="h-1.5" />
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            type="submit"
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary my-1.5 mr-1.5 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
            Search
          </button>
        </form>

        {/* ─── MOBILE ────────────────────────────────────────── */}
        <MobileSearchBar
          what={what}
          setWhat={setWhat}
          where={where}
          setWhere={setWhere}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

/* ── Mobile variant ── */
function MobileSearchBar({
  what,
  setWhat,
  where,
  setWhere,
  onSubmit,
}: {
  what: string;
  setWhat: (v: string) => void;
  where: string;
  setWhere: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [whereOpen, setWhereOpen] = useState(false);

  const selectLocation = (label: string) => {
    setWhere(label);
    setWhereOpen(false);
  };

  return (
    <form onSubmit={onSubmit} className="md:hidden flex flex-col gap-2">
      {/* What */}
      <div className="flex items-center gap-3 rounded-2xl bg-white border border-outline-variant px-4 py-3.5 shadow-sm">
        <span className="material-symbols-outlined text-[20px] text-outline shrink-0" aria-hidden="true">
          search
        </span>
        <input
          className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface outline-none focus:ring-0 placeholder:text-outline placeholder:font-normal"
          placeholder="Restaurant, cuisine, café or place..."
          type="text"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
        />
        {what && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => setWhat("")}
            className="shrink-0 flex size-6 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* Where */}
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-white border border-outline-variant px-4 py-3.5 shadow-sm text-left"
          onClick={() => setWhereOpen((o) => !o)}
        >
          <span className="material-symbols-outlined text-[20px] text-outline shrink-0" aria-hidden="true">
            location_on
          </span>
          <span className={`flex-1 text-sm font-medium ${where ? "text-on-surface" : "text-outline"}`}>
            {where || "Neighbourhood or city..."}
          </span>
          <span
            className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-200 ${
              whereOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>

        {whereOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-xl">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold text-primary hover:bg-primary-container transition-colors"
              onClick={() => selectLocation("Current location")}
            >
              <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">
                my_location
              </span>
              Use current location
            </button>
            <div className="mx-4 border-t border-outline-variant" />
            <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Popular areas
            </p>
            {LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                onClick={() => selectLocation(loc.label)}
              >
                <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">
                  {loc.icon}
                </span>
                {loc.label}
              </button>
            ))}
            <div className="h-1.5" />
          </div>
        )}
      </div>

      {/* Search button */}
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-white hover:bg-[#0f46b8] transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
        Search
      </button>
    </form>
  );
}
