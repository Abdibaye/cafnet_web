"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";

const navItems = [
  { label: "Restaurants", href: "/restaurants" },
  { label: "Cafés", href: "/cafes" },
  { label: "Drinks & More", href: "/drinks" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const { authReady, isAuthenticated, currentUser, startSignIn, logout } = useCustomer();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
        setIsLanguageOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!accountRef.current?.contains(target)) setIsAccountOpen(false);
      if (!languageRef.current?.contains(target)) setIsLanguageOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const isPrimaryActive = (href: string) => {
    if (href === "/explore") {
      return pathname === "/" || pathname.startsWith("/explore");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const signOut = () => {
    logout();
    setIsAccountOpen(false);
    router.push("/explore");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white border-b border-outline-variant/60 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 md:h-20 md:gap-7 md:px-6 lg:px-12">
        <Link className="flex shrink-0 items-center py-2" href="/" aria-label="Cafnet home">
          <img
            alt="Cafnet Logo - Royal Blue & Coral"
            className="h-9 w-auto object-contain md:h-12"
            src="/images/logo.png"
          />
        </Link>

        <nav className="hidden h-full flex-1 items-center justify-center gap-6 md:flex lg:gap-8" aria-label="Primary navigation">
          <Link
            className={`relative inline-flex h-full items-center text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${
              isPrimaryActive("/explore") ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"
            }`}
            href="/explore"
          >
            Explore
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              className={`relative inline-flex h-full items-center text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${
                isPrimaryActive(item.href) ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-5">
          <Link
            className="hidden text-sm font-medium text-primary transition-colors hover:text-primary/75 lg:inline-flex"
            href="/business"
          >
            For businesses
          </Link>

          <div ref={languageRef} className="relative hidden sm:block">
            <button
              type="button"
              aria-expanded={isLanguageOpen}
              aria-haspopup="menu"
              className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-on-surface transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
              onClick={() => setIsLanguageOpen((open) => !open)}
            >
              EN
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span>
            </button>
            {isLanguageOpen && (
              <div
                className="absolute right-0 top-full mt-2 min-w-44 rounded-xl border border-outline-variant bg-white p-2 shadow-lg"
                role="menu"
                aria-label="Language"
              >
                <div className="px-3 py-2 text-sm font-semibold text-on-surface" role="menuitem">
                  English <span className="ml-1 text-xs font-normal text-on-surface-variant">(current)</span>
                </div>
                <p className="px-3 pb-2 text-xs leading-5 text-on-surface-variant">Amharic & Afaan Oromoo coming soon.</p>
              </div>
            )}
          </div>

          {authReady && (
            isAuthenticated ? (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl text-sm font-semibold text-primary hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-primary cursor-pointer px-2 py-1"
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsAccountOpen((open) => !open)}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-primary font-bold">
                    {currentUser?.avatar || "A"}
                  </span>
                  <span className="hidden lg:inline">Account</span>
                  <span className="material-symbols-outlined hidden text-[16px] lg:inline" aria-hidden="true">
                    expand_more
                  </span>
                </button>

                {isAccountOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 min-w-52 rounded-xl border border-outline-variant bg-white p-1.5 shadow-xl divide-y divide-outline-variant/60"
                    role="menu"
                    aria-label="Account"
                  >
                    <div className="py-1">
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/account"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        My account
                      </Link>
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/reservations"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        My reservations
                      </Link>
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/saved"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Saved places
                      </Link>
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/following"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Following
                      </Link>
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/business/dashboard"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        My businesses
                      </Link>
                    </div>

                    <div className="py-1">
                      <Link
                        className="block rounded-lg px-3.5 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/account/settings"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        className="block w-full rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
                        role="menuitem"
                        onClick={signOut}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                className="hidden min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary sm:inline-flex cursor-pointer"
                onClick={startSignIn}
              >
                Sign in
              </button>
            )
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-on-surface hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary md:hidden cursor-pointer"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-on-surface/30 backdrop-blur-xs md:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMobileMenu();
          }}
        >
          <aside
            className="ml-auto h-full w-[min(22rem,88vw)] overflow-y-auto bg-white px-6 pb-12 pt-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Utility menu"
          >
            <div className="border-b border-outline-variant pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Account</p>
              {isAuthenticated ? (
                <div className="mt-3 space-y-1">
                  <div className="mb-4 flex items-center gap-3 rounded-xl bg-surface-container-low p-3">
                    <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-primary font-bold">
                      {currentUser?.avatar || "A"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-on-surface">{currentUser?.name}</p>
                      <p className="truncate text-xs text-on-surface-variant">{currentUser?.phone}</p>
                    </div>
                  </div>
                  <Link className="block py-2 text-sm font-semibold text-on-surface hover:text-primary" href="/account" onClick={closeMobileMenu}>
                    My account
                  </Link>
                  <Link className="block py-2 text-sm text-on-surface hover:text-primary" href="/reservations" onClick={closeMobileMenu}>
                    My reservations
                  </Link>
                  <Link className="block py-2 text-sm text-on-surface hover:text-primary" href="/saved" onClick={closeMobileMenu}>
                    Saved places
                  </Link>
                  <Link className="block py-2 text-sm text-on-surface hover:text-primary" href="/following" onClick={closeMobileMenu}>
                    Following
                  </Link>
                  <Link className="block py-2 text-sm text-on-surface hover:text-primary" href="/business/dashboard" onClick={closeMobileMenu}>
                    My businesses
                  </Link>
                  <Link className="block py-2 text-sm text-on-surface hover:text-primary" href="/account/settings" onClick={closeMobileMenu}>
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="block w-full text-left py-2 text-sm font-semibold text-secondary cursor-pointer"
                    onClick={() => {
                      signOut();
                      closeMobileMenu();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white cursor-pointer"
                  onClick={() => {
                    startSignIn();
                    closeMobileMenu();
                  }}
                >
                  Sign in
                </button>
              )}
            </div>

            <div className="border-b border-outline-variant py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business</p>
              <Link className="mt-3 block text-sm font-semibold text-on-surface hover:text-primary" href="/business" onClick={closeMobileMenu}>
                For businesses
              </Link>
              <Link className="mt-2 block text-sm text-on-surface-variant hover:text-primary" href="/business/claim" onClick={closeMobileMenu}>
                Claim your listing
              </Link>
              <Link className="mt-2 block text-sm text-on-surface-variant hover:text-primary" href="/business/dashboard" onClick={closeMobileMenu}>
                Business Center
              </Link>
            </div>

            <div className="py-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Preferences</p>
              <div className="mt-3 flex items-center justify-between text-sm text-on-surface">
                <span>Language</span>
                <span className="font-semibold text-primary">English</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
