"use client";

import { useState } from "react";

type TrustStripProps = {
  variant?: "default" | "homepage";
};

export default function TrustStrip({ variant = "default" }: TrustStripProps) {
  const [locationName, setLocationName] = useState("your area");
  const isHomepage = variant === "homepage";

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationName("your current location");
          console.log("Location:", position.coords);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  };

  return (
    <section className="bg-background pb-0 pt-4 md:pt-5">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1.5 gap-y-1 px-5 text-[13px] text-on-surface-variant lg:px-12">
        <span className="material-symbols-outlined mr-0.5 text-[17px] text-on-surface-variant" aria-hidden="true">
          location_on
        </span>
        <span>
          {isHomepage ? "Around " : "Showing places around "}
          <strong className="font-semibold text-on-surface">{isHomepage && locationName === "your area" ? "your area" : locationName}</strong>
        </span>
        <button
          className="inline-flex cursor-pointer items-center gap-1 font-semibold text-secondary transition-colors hover:text-[#d95547]"
          type="button"
          onClick={handleGetLocation}
        >
          <span>{isHomepage ? "Use my current location" : "Use my current location"}</span>
          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
    </section>
  );
}
