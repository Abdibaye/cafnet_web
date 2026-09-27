"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { popularSearches } from "@/data/popularSearches";
import { searchBusinesses } from "@/data/searchBusinesses";

type SearchBarProps = {
  variant?: "default" | "explore" | "homepage";
  initialQuery?: string;
};

export default function SearchBar({ variant = "default", initialQuery = "" }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const isExplore = variant === "explore";
  const placeholder = isExplore ? "Search places, cuisines, or events..." : "Restaurant, cuisine, café or place...";

  useEffect(() => setQuery(initialQuery), [initialQuery]);

  useEffect(() => {
    if (isMobileSearchOpen) inputRef.current?.focus();
  }, [isMobileSearchOpen]);

  const submitSearch = (value = query) => {
    const nextQuery = value.trim().replace(/\s+/g, " ");
    if (!nextQuery) {
      setIsFocused(true);
      inputRef.current?.focus();
      return;
    }
    setQuery(nextQuery);
    setIsFocused(false);
    setIsMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
  };

  const clearSearch = () => {
    setQuery("");
    setIsFocused(true);
    if (pathname === "/search") router.replace("/search");
    inputRef.current?.focus();
  };

  const matchingBusinesses = query.trim() ? searchBusinesses(query).slice(0, 3) : [];
  const matchingPopularSearches = query.trim()
    ? popularSearches.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 3)
    : popularSearches;

  const suggestions = (mobile = false) => (
    <div className={`${mobile ? "mt-6" : "absolute left-0 right-0 top-full z-20 mt-2"} overflow-hidden border border-outline-variant bg-white shadow-[0_12px_30px_rgba(20,33,61,0.1)]`}>
      {!query.trim() && <p className="px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Popular searches</p>}
      {matchingPopularSearches.map((item) => (
        <button key={item.query} type="button" className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary" onClick={() => submitSearch(item.query)}>
          <span className="material-symbols-outlined text-[19px] text-secondary" aria-hidden="true">search</span>{item.label}
        </button>
      ))}
      {matchingBusinesses.length > 0 && <p className="border-t border-outline-variant px-5 pb-2 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">Places</p>}
      {matchingBusinesses.map((business) => (
        <Link key={business.id} href={`/business/${business.id}`} className="flex items-center gap-3 px-5 py-3 text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary" onClick={() => { setIsFocused(false); setIsMobileSearchOpen(false); }}>
          <span className="material-symbols-outlined text-[19px] text-secondary" aria-hidden="true">storefront</span><span className="truncate">{business.name}</span>
        </Link>
      ))}
      {query.trim() && matchingPopularSearches.length === 0 && matchingBusinesses.length === 0 && <p className="px-5 py-4 text-sm text-on-surface-variant">Press Enter to search all places.</p>}
    </div>
  );

  const input = (mobile = false) => (
    <div className="flex min-h-12 min-w-0 flex-1 items-center px-4 py-3 md:min-h-14">
      {mobile && <button type="button" className="mr-3 text-on-surface" aria-label="Back" onClick={() => setIsMobileSearchOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">arrow_back</span></button>}
      <span className="material-symbols-outlined mr-2 text-[20px] text-outline" aria-hidden="true">search</span>
      <input ref={inputRef} className="w-full border-0 bg-transparent p-0 text-sm font-normal text-on-surface outline-none placeholder:text-outline/70 focus:ring-0 md:text-base" placeholder={placeholder} type="search" value={query} onChange={(event) => setQuery(event.target.value)} onFocus={() => setIsFocused(true)} onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }} autoFocus={mobile} />
      {query && <button type="button" className="ml-2 flex size-7 shrink-0 items-center justify-center rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface" aria-label="Clear search" onClick={clearSearch}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span></button>}
    </div>
  );

  const searchControls = (
    <>
      <div className="hidden min-h-12 shrink-0 items-center justify-between gap-2 border-l border-outline-variant px-4 py-2.5 md:flex md:min-h-14 md:px-4 md:py-3"><span className="whitespace-nowrap text-sm text-on-surface-variant">Now</span><span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span></div>
      <div className="hidden min-h-12 shrink-0 items-center justify-between gap-2 border-l border-outline-variant px-4 py-2.5 md:flex md:min-h-14 md:px-4 md:py-3"><span className="whitespace-nowrap text-sm text-on-surface-variant">2 people</span><span className="material-symbols-outlined text-[18px] text-outline" aria-hidden="true">arrow_drop_down</span></div>
      <button className="hidden min-h-14 shrink-0 cursor-pointer items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0f46b8] md:flex" type="submit"><span className="material-symbols-outlined text-[20px]" aria-hidden="true">search</span><span>Search</span></button>
    </>
  );

  return (
    <section className={`bg-background px-5 lg:px-12 ${isExplore || variant === "homepage" ? "pb-0 pt-5 md:pt-7" : "py-6 md:py-10"}`}>
      <div className="mx-auto max-w-7xl">
        <div className="relative hidden md:block">
          <form className={`flex overflow-hidden bg-white ring-1 ring-outline-variant ${isExplore || variant === "homepage" ? "rounded-[14px] shadow-[0_4px_18px_rgba(20,33,61,0.05)]" : "rounded-xl"}`} onSubmit={(event) => { event.preventDefault(); submitSearch(); }}>
            {input()}{searchControls}
          </form>
          {isFocused && suggestions()}
        </div>
        <div className="flex w-full items-center overflow-hidden rounded-[14px] bg-white text-left ring-1 ring-outline-variant md:hidden">
          <button type="button" className="flex min-h-12 min-w-0 flex-1 items-center px-4 py-3 text-left text-sm text-outline" onClick={() => setIsMobileSearchOpen(true)}><span className="material-symbols-outlined mr-2 text-[20px]" aria-hidden="true">search</span><span className="truncate">{query || placeholder}</span></button>
          {query && <button type="button" className="mr-3 flex size-7 shrink-0 items-center justify-center rounded-full text-outline hover:bg-surface-container-low hover:text-on-surface" aria-label="Clear search" onClick={clearSearch}><span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span></button>}
        </div>
        {isMobileSearchOpen && <div className="fixed inset-0 z-[60] bg-background px-5 py-4 md:hidden"><div className="flex items-center border-b border-outline-variant">{input(true)}</div>{suggestions(true)}</div>}
      </div>
    </section>
  );
}
