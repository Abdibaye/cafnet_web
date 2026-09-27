"use client";

import { useState } from "react";

export default function SearchBar() {
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("Now");
  const [people, setPeople] = useState("2 people");

  const handleSearch = () => {
    console.log("Searching for:", { location, time, people });
  };

  return (
    <section className="bg-background py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-outline-variant md:flex-row md:items-stretch">
            <div className="flex min-w-0 flex-1 items-center px-4 py-4 md:py-3">
              <span className="material-symbols-outlined mr-2 text-[20px] text-outline">search</span>
              <input
                className="w-full border-0 bg-transparent p-0 text-sm font-normal text-on-surface outline-none placeholder:text-outline/70 focus:ring-0 md:text-base"
                placeholder="Restaurant, cuisine, café or place..."
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-outline-variant px-4 py-3 transition-colors hover:bg-surface-container-low md:border-l md:border-t-0">
              <span className="whitespace-nowrap text-sm text-on-surface-variant">{time}</span>
              <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-outline-variant px-4 py-3 transition-colors hover:bg-surface-container-low md:border-l md:border-t-0">
              <span className="whitespace-nowrap text-sm text-on-surface-variant">{people}</span>
              <span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span>
            </div>

            <button
              className="flex shrink-0 cursor-pointer items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0f46b8]"
              type="button"
              onClick={handleSearch}
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
