"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* ── Static neighbourhood suggestions ─────────────────────── */
const LOCATIONS = [
  { label: "Bole",      icon: "location_on" },
  { label: "Kazanchis", icon: "location_on" },
  { label: "Piassa",    icon: "location_on" },
  { label: "Merkato",   icon: "location_on" },
];

/* ── Geo states ────────────────────────────────────────────── */
type GeoStatus = "idle" | "loading" | "success" | "denied" | "error";

/* ── Declare the google global that the Maps JS SDK injects ── */
declare global {
  interface Window {
    google?: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: { location: { lat: number; lng: number } },
            callback: (
              results: Array<{
                address_components: Array<{ long_name: string; types: string[] }>;
                formatted_address: string;
              }> | null,
              status: string
            ) => void
          ) => void;
        };
      };
    };
  }
}

/* ── Preferred component types (most specific → least) ───── */
const PREFERRED_TYPES = [
  "neighborhood",
  "sublocality_level_1",
  "sublocality",
  "administrative_area_level_2",
  "locality",
];

/**
 * Reverse-geocode using google.maps.Geocoder (Maps JS SDK loaded via <script>
 * in layout.tsx — same pattern as the official Google Maps demo).
 * Falls back silently to OSM Nominatim when billing is not yet active.
 */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // ── Try Google Maps JS SDK Geocoder ───────────────────────
  if (typeof window !== "undefined" && window.google?.maps?.Geocoder) {
    return new Promise<string>((resolve) => {
      const geocoder = new window.google!.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          for (const result of results) {
            for (const targetType of PREFERRED_TYPES) {
              const match = result.address_components.find((c) =>
                c.types.includes(targetType)
              );
              if (match?.long_name) {
                resolve(match.long_name);
                return;
              }
            }
          }
          // Fallback to first segment of formatted_address
          resolve(results[0].formatted_address.split(",")[0]);
        } else {
          // Non-OK status (e.g. billing not yet enabled) → silent fallback
          reverseGeocodeNominatim(lat, lon)
            .then(resolve)
            .catch(() => resolve("Current location"));
        }
      });
    });
  }

  // ── Fallback: OSM Nominatim (free, no billing required) ───
  return reverseGeocodeNominatim(lat, lon);
}

/* ── OSM Nominatim reverse geocoding ─────────────────────── */
async function reverseGeocodeNominatim(lat: number, lon: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=en`;
  const res = await fetch(url, { headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("Nominatim error");
  const data = await res.json();
  const a = data.address ?? {};
  return (
    a.neighbourhood ||
    a.suburb        ||
    a.quarter       ||
    a.village       ||
    a.town          ||
    a.city_district ||
    a.district      ||
    a.city          ||
    a.county        ||
    "Current location"
  );
}



/* ── Shared hook: geolocation + reverse-geocoding ──────────── */
function useCurrentLocation(onSuccess: (label: string) => void) {
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const label = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setGeoStatus("success");
          onSuccess(label);
        } catch {
          setGeoStatus("error");
          onSuccess("Current location");
        }
      },
      (err) => {
        setGeoStatus(err.code === 1 ? "denied" : "error");
      },
      { timeout: 8000 }
    );
  }, [onSuccess]);

  return { geoStatus, detect };
}

/* ── Location dropdown (shared between desktop & mobile) ───── */
function LocationDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (label: string) => void;
  onClose: () => void;
}) {
  const handleSelect = (label: string) => {
    onSelect(label);
    onClose();
  };

  const { geoStatus, detect } = useCurrentLocation((label) => {
    handleSelect(label);
  });

  const geoLabel: Record<GeoStatus, string> = {
    idle:    "Use current location",
    loading: "Detecting location…",
    success: "Location detected",
    denied:  "Permission denied",
    error:   "Could not detect location",
  };

  const geoIcon: Record<GeoStatus, string> = {
    idle:    "my_location",
    loading: "sync",
    success: "my_location",
    denied:  "location_disabled",
    error:   "location_off",
  };

  return (
    <>
      {/* Auto-detect */}
      <button
        type="button"
        disabled={geoStatus === "loading"}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none ${
          geoStatus === "denied" || geoStatus === "error"
            ? "text-secondary cursor-not-allowed opacity-70"
            : "text-primary hover:bg-primary-container cursor-pointer"
        }`}
        onClick={detect}
      >
        <span
          className={`material-symbols-outlined text-[20px] shrink-0 ${
            geoStatus === "loading" ? "animate-spin" : ""
          } ${
            geoStatus === "denied" || geoStatus === "error"
              ? "text-secondary"
              : "text-primary"
          }`}
          aria-hidden="true"
        >
          {geoIcon[geoStatus]}
        </span>
        {geoLabel[geoStatus]}
      </button>

      {/* Error hint */}
      {(geoStatus === "denied" || geoStatus === "error") && (
        <p className="px-4 pb-2 text-[11px] text-on-surface-variant leading-snug">
          {geoStatus === "denied"
            ? "Allow location access in your browser settings."
            : "Something went wrong. Please try again."}
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
    const loc = where.trim();
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
              className={`flex items-center gap-2.5 px-5 py-3.5 cursor-pointer min-w-[160px] transition-colors select-none ${
                whereOpen ? "bg-surface-container-low" : ""
              }`}
              onClick={() => setWhereOpen((o) => !o)}
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
                className="w-full bg-transparent border-0 p-0 text-sm font-medium text-on-surface outline-none focus:ring-0 placeholder:text-outline placeholder:font-normal cursor-pointer pointer-events-none"
                placeholder="Neighbourhood or city..."
                type="text"
                value={where}
                readOnly
                tabIndex={-1}
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

            {/* Dropdown */}
            {whereOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-xl">
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
  onSubmit,
}: {
  what: string;
  setWhat: (v: string) => void;
  where: string;
  setWhere: (v: string) => void;
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
