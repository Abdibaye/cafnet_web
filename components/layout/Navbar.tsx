"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";

export default function Navbar() {
  const pathname = usePathname();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const { authReady, isAuthenticated, currentUser, startSignIn } = useCustomer();

  const navItems = [
    { label: "Restaurants", href: "/restaurants" },
    { label: "Cafés", href: "/cafes" },
    { label: "Drinks & More", href: "/drinks" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 border-b border-transparent px-5 md:h-20 md:px-6 lg:px-12">
        <Link className="flex shrink-0 items-center py-2" href="/" aria-label="Cafnet home">
          <img
            alt="Cafnet Logo - Royal Blue & Coral"
            className="h-9 w-auto object-contain md:h-14"
            src="/images/logo.png"
          />
        </Link>

        <nav className="hidden h-full flex-1 items-center justify-center gap-7 md:flex" aria-label="Primary navigation">
          <Link
            className={`relative inline-flex h-full items-center gap-1.5 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${pathname === "/explore" || pathname.startsWith("/explore/") ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"}`}
            href="/explore"
          >
            Explore
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
          </Link>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                className={`relative inline-flex h-full items-center text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${isActive ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"}`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          {authReady && (isAuthenticated ? <Link href="/account" className="inline-flex items-center gap-2 text-sm font-semibold text-primary" aria-label="Open your Cafnet account"><span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-primary">{currentUser?.avatar}</span><span className="hidden lg:inline">{currentUser?.name}</span></Link> : <button type="button" className="text-sm font-semibold text-primary hover:text-primary/75" onClick={startSignIn}>Sign in</button>)}
          <Link
            className="hidden text-sm font-medium text-primary transition-colors hover:text-primary/75 lg:inline-flex"
            href="/for-restaurants"
          >
            List Your Business
          </Link>

          <div className="relative">
            <button
              type="button"
              aria-expanded={isLanguageOpen}
              aria-haspopup="listbox"
              className="inline-flex items-center gap-1 text-sm font-medium text-on-surface transition-colors hover:text-primary"
              onClick={() => setIsLanguageOpen((isOpen) => !isOpen)}
            >
              EN
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-3 min-w-36 border border-outline-variant bg-white py-1 shadow-sm" role="listbox" aria-label="Language">
                {["English", "አማርኛ", "Afaan Oromoo"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary"
                    onClick={() => setIsLanguageOpen(false)}
                    role="option"
                    aria-selected={item === "English"}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-on-surface transition-colors hover:text-primary"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[22px]" aria-hidden="true">menu</span>
            <span className="hidden xl:inline">Menu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
