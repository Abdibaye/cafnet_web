"use client";

import { useState } from "react";

type SearchBarProps = {
  variant?: "default" | "explore" | "homepage";
};

export default function SearchBar({ variant = "default" }: SearchBarProps) {
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("Now");
  const [people, setPeople] = useState("2 people");
  const isExplore = variant === "explore";
  const isHomepage = variant === "homepage";

  const handleSearch = () => {
    console.log("Searching for:", { location, time, people });
  };

  return (
    <section className={`bg-background px-6 lg:px-12 ${isExplore || isHomepage ? "pb-0 pt-7" : "py-8 md:py-10"}`}>
      <div className="mx-auto max-w-7xl">
        <div className={`flex flex-col overflow-hidden bg-white ring-1 ring-outline-variant md:flex-row md:items-stretch ${isExplore || isHomepage ? "rounded-[14px] shadow-[0_4px_18px_rgba(20,33,61,0.05)]" : "rounded-xl"}`}>
            <div className="flex min-h-14 min-w-0 flex-1 items-center px-4 py-3">
              <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
              <input
                className="w-full border-0 bg-transparent p-0 text-sm font-normal text-on-surface outline-none placeholder:text-outline/70 focus:ring-0 md:text-base"
                placeholder={isExplore ? "Search places, cuisines, or events..." : isHomepage ? "Restaurant, cuisine, or place..." : "Restaurant, cuisine, café or place..."}
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-t border-outline-variant px-4 py-3 transition-colors hover:bg-surface-container-low md:border-l md:border-t-0">
              <span className="whitespace-nowrap text-sm text-on-surface-variant">{time}</span>
              <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span>
            </div>

            <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-t border-outline-variant px-4 py-3 transition-colors hover:bg-surface-container-low md:border-l md:border-t-0">
              <span className="whitespace-nowrap text-sm text-on-surface-variant">{people}</span>
              <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span>
            </div>

            <button
              className="flex min-h-14 shrink-0 cursor-pointer items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0f46b8]"
              type="button"
              onClick={handleSearch}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search</span>
            </button>
          </div>
      </div>
    </section>
  );
}
