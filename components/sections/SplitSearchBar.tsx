"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocation } from "@/components/LocationProvider";

/* ── Static neighbourhood suggestions ─────────────────────── */
const LOCATIONS = [
  { label: "Bole",      icon: "location_on" },
  { label: "Kazanchis", icon: "location_on" },
  { label: "Piassa",    icon: "location_on" },
  { label: "Merkato",   icon: "location_on" },
];

/* ── Location dropdown (shared between desktop & mobile) ───── */
function LocationDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (label: string) => void;
  onClose: () => void;
}) {
  const { location, geoStatus, isDetecting, detectLocation } = useLocation();

  const handleSelect = (label: string) => {
    onSelect(label);
    onClose();
  };

  const handleUseCurrentLocation = () => {
    if (location) {
      handleSelect(location);
    } else {
      detectLocation();
    }
  };

  return (
    <>
      {/* Current location button */}
      <button
        type="button"
        disabled={isDetecting}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none ${
          geoStatus === "denied"
            ? "text-secondary cursor-pointer hover:bg-surface-container-low"
            : "text-primary hover:bg-primary-container cursor-pointer"
        }`}
        onClick={handleUseCurrentLocation}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`material-symbols-outlined text-[20px] shrink-0 ${
              isDetecting ? "animate-spin text-primary" : "text-primary"
            }`}
            aria-hidden="true"
          >
            {isDetecting ? "sync" : "my_location"}
          </span>
          <span className="truncate">
            {isDetecting
              ? "Detecting location…"
              : location
              ? `Current location (${location})`
              : "Use current location"}
          </span>
        </div>
        {location && (
          <span className="material-symbols-outlined text-[18px] text-primary shrink-0" aria-hidden="true">
            check_circle
          </span>
        )}
      </button>

      {/* Permission denied hint */}
      {geoStatus === "denied" && (
        <p className="px-4 pb-2 text-[11px] text-on-surface-variant leading-snug">
          Location access denied. Enable location in your browser settings to auto-detect.
        </p>
      )}

      {/* Error hint */}
      {geoStatus === "error" && !location && (
        <p className="px-4 pb-2 text-[11px] text-on-surface-variant leading-snug">
          Could not detect location. Tap to retry or select a neighborhood below.
        </p>
      )}

      <div className="mx-4 border-t border-outline-variant" />

      <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
        Popular areas
      </p>

      {LOCATIONS.map((loc) => (
        <button
          key={loc.label}
          type="button"
          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary focus-visible:outline-none cursor-pointer"
          onClick={() => handleSelect(loc.label)}
        >
          <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">
            {loc.icon}
          </span>
          {loc.label}
        </button>
      ))}

      <div className="h-1.5" />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main component
══════════════════════════════════════════════════════════════ */
export default function SplitSearchBar() {
  const router = useRouter();
  const { location, placeholder, isDetecting } = useLocation();

  const [what, setWhat]               = useState("");
  const [where, setWhere]             = useState("");
  const [whatFocused, setWhatFocused] = useState(false);
  const [whereOpen, setWhereOpen]     = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const whereInputRef = useRef<HTMLInputElement>(null);

  /* ── close on outside click / Escape ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWhereOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setWhereOpen(false);
        setWhatFocused(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, []);

  const anyFocused = whatFocused || whereOpen;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q   = what.trim();
    const loc = (where.trim() || location || "").trim();
    if (!q && !loc) return;
    const params = new URLSearchParams();
    if (q)   params.set("q", q);
    if (loc) params.set("location", loc);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <section className="px-5 pt-5 pb-0 lg:px-12">
      <div ref={containerRef} className="mx-auto max-w-7xl">

        {/* ─── DESKTOP ──────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className={`hidden md:flex items-stretch rounded-full bg-white border transition-all duration-200 shadow-sm ${
            anyFocused
              ? "border-primary/40 shadow-md"
              : "border-outline-variant"
          }`}
        >
          {/* What */}
          <div className="flex flex-1 items-center min-w-0 px-5 py-3.5 gap-3 rounded-l-full">
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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit(e as unknown as React.FormEvent);
              }}
            />
          </div>

          {/* Divider */}
          <div className="self-stretch w-px bg-outline-variant" aria-hidden="true" />

          {/* Where */}
          <div className="relative shrink-0">
            <div
              className={`flex items-center gap-2.5 px-5 py-3.5 cursor-pointer min-w-[200px] transition-colors select-none ${
                whereOpen ? "bg-surface-container-low" : ""
              }`}
              onClick={() => {
                setWhereOpen((o) => !o);
                whereInputRef.current?.focus();
              }}
            >
              <span
                className={`material-symbols-outlined text-[20px] shrink-0 transition-colors ${
                  isDetecting
                    ? "animate-spin text-primary"
                    : whereOpen || location
                    ? "text-primary"
                    : "text-outline"
                }`}
                aria-hidden="true"
              >
                {isDetecting ? "sync" : "location_on"}
              </span>
              <input
                ref={whereInputRef}
                className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface outline-none focus:ring-0 placeholder:text-outline placeholder:font-normal cursor-pointer"
                placeholder={placeholder}
                type="text"
                value={where}
                onChange={(e) => setWhere(e.target.value)}
                onFocus={() => setWhereOpen(true)}
                onClick={(e) => {
                  e.stopPropagation();
                  setWhereOpen(true);
                }}
              />
              {where && (
                <button
                  type="button"
                  aria-label="Clear location"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWhere("");
                  }}
                  className="shrink-0 flex size-5 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">
                    close
                  </span>
                </button>
              )}
              <span
                className={`material-symbols-outlined text-[18px] shrink-0 text-outline transition-transform duration-200 ${
                  whereOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              >
                expand_more
              </span>
            </div>

            {/* Dropdown */}
            {whereOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 min-w-[260px] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-xl">
                <LocationDropdown
                  onSelect={(label) => setWhere(label)}
                  onClose={() => setWhereOpen(false)}
                />
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

        {/* ─── MOBILE ───────────────────────────────────────── */}
        <MobileSearchBar
          what={what}
          setWhat={setWhat}
          where={where}
          setWhere={setWhere}
          placeholder={placeholder}
          isDetecting={isDetecting}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}

/* ── Mobile variant ─────────────────────────────────────────── */
function MobileSearchBar({
  what,
  setWhat,
  where,
  setWhere,
  placeholder,
  isDetecting,
  onSubmit,
}: {
  what: string;
  setWhat: (v: string) => void;
  where: string;
  setWhere: (v: string) => void;
  placeholder: string;
  isDetecting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const [whereOpen, setWhereOpen] = useState(false);

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
            className="shrink-0 flex size-6 items-center justify-center rounded-full bg-surface-container text-on-surface-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* Where */}
      <div className="relative">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-white border border-outline-variant px-4 py-3.5 shadow-sm text-left cursor-pointer"
          onClick={() => setWhereOpen((o) => !o)}
        >
          <span
            className={`material-symbols-outlined text-[20px] shrink-0 ${
              isDetecting ? "animate-spin text-primary" : "text-outline"
            }`}
            aria-hidden="true"
          >
            {isDetecting ? "sync" : "location_on"}
          </span>
          <span
            className={`flex-1 text-sm font-medium truncate ${
              where ? "text-on-surface" : "text-outline"
            }`}
          >
            {where || placeholder}
          </span>
          {where && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear location"
              onClick={(e) => {
                e.stopPropagation();
                setWhere("");
              }}
              className="shrink-0 flex size-6 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
                close
              </span>
            </span>
          )}
          <span
            className={`material-symbols-outlined text-[18px] text-outline transition-transform duration-200 shrink-0 ${
              whereOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            expand_more
          </span>
        </button>

        {whereOpen && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-xl">
            <LocationDropdown
              onSelect={(label) => setWhere(label)}
              onClose={() => setWhereOpen(false)}
            />
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
