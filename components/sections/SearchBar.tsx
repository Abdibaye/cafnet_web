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
    <section className="py-8 bg-white border-b border-surface-container">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
            <div className="bg-surface-container-lowest/80 rounded-xl border border-surface-container-high shadow-md flex flex-col md:flex-row items-stretch overflow-hidden">
            <div className="flex-1 flex items-center px-4 py-3 md:py-2.5 min-w-0">
              <span className="material-symbols-outlined text-[20px] text-outline mr-2 md:hidden">search</span>
              <input
                className="w-full bg-transparent border-0 p-0 text-on-surface text-body-md text-sm md:text-base focus:ring-0 focus:outline-none placeholder:text-outline/70 font-normal"
                placeholder="Location, cuisine, restaurant name, etc."
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            
            <div className="hidden md:flex items-center justify-between px-3.5 py-3 md:py-2.5 cursor-pointer hover:bg-surface-container-low/60 transition-colors border-t md:border-t-0 border-surface-container gap-2 shrink-0">
              <span className="text-body-md text-sm text-on-surface-variant whitespace-nowrap">{time}</span>
              <span className="material-symbols-outlined text-[18px] text-outline">arrow_drop_down</span>
            </div>
            
            <div className="hidden md:block w-px bg-surface-container self-stretch"></div>
            
            <div className="hidden md:flex items-center justify-between px-3.5 py-3 md:py-2.5 cursor-pointer hover:bg-surface-container-low/60 transition-colors border-t md:border-t-0 border-surface-container gap-2 shrink-0">
              <span className="text-body-md text-sm text-on-surface-variant whitespace-nowrap">{people}</span>
              <span className="material-symbols-outlined text-[18px] text-outline">arrow_drop_down</span>
            </div>
            
            <button
              className="hidden md:flex bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-7 py-3 md:py-3.5 flex items-center justify-center gap-2 font-label-md font-bold transition-colors cursor-pointer shrink-0"
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
