"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useBusinessOwner } from "@/components/BusinessOwnerProvider";

const navItems = [
  { label: "Restaurants", href: "/restaurants" },
  { label: "Cafés", href: "/cafes" },
  { label: "Drinks & More", href: "/drinks" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { authReady, isAuthenticated, currentUser, startSignIn, startSignUp, logout } = useCustomer();
  const { rawManagedBusinesses, managedBusinesses, claims, submissions } = useBusinessOwner();

  const hasBusinesses = Boolean(
    (rawManagedBusinesses && rawManagedBusinesses.length > 0) ||
    (managedBusinesses && managedBusinesses.length > 0) ||
    (claims && claims.length > 0) ||
    (submissions && submissions.length > 0)
  );

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!accountRef.current?.contains(target)) setIsAccountOpen(false);
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

        <div className="ml-auto flex shrink-0 items-center gap-2.5 md:gap-3">
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
                    className="absolute right-0 top-full mt-2 min-w-64 rounded-2xl border border-outline-variant/80 bg-white p-2 shadow-xl divide-y divide-outline-variant/60"
                    role="menu"
                    aria-label="Account"
                  >
                    {/* Clickable Profile Header -> /account */}
                    <div className="pb-1.5">
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                        className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-all hover:bg-surface-container-low"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-primary transition-transform group-hover:scale-105">
                            {currentUser?.avatar || "A"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                              {currentUser?.name || "Personal Account"}
                            </p>
                            <p className="truncate text-xs text-on-surface-variant">
                              {currentUser?.phone || currentUser?.email || "View account"}
                            </p>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-outline-variant group-hover:text-primary transition-colors shrink-0">
                          chevron_right
                        </span>
                      </Link>
                    </div>

                    <div className="py-1">
                      {/* My Business Account - ONLY if user has added/managed a business */}
                      {hasBusinesses && (
                        <Link
                          className="group flex items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                          href="/business/dashboard"
                          role="menuitem"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <span className="material-symbols-outlined text-[16px]">storefront</span>
                            </span>
                            <span className="truncate">My Business Account</span>
                          </div>
                          <span className="material-symbols-outlined text-outline-variant text-[16px] group-hover:text-primary transition-colors">
                            chevron_right
                          </span>
                        </Link>
                      )}
                      <Link
                        className="block rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors"
                        href="/account/settings"
                        role="menuitem"
                        onClick={() => setIsAccountOpen(false)}
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-secondary hover:bg-surface-container-low transition-colors cursor-pointer"
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
              <>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    className="min-h-10 items-center justify-center rounded-xl px-3.5 py-2 text-sm font-semibold text-on-surface hover:text-primary hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary inline-flex cursor-pointer transition-colors"
                    onClick={startSignIn}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="min-h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f46b8] focus-visible:outline-2 focus-visible:outline-primary inline-flex cursor-pointer shadow-xs transition-colors"
                    onClick={startSignUp}
                  >
                    Create account
                  </button>
                </div>

                {/* Visual Divider between Customer Auth and Business Partner */}
                <div className="hidden sm:block h-8 w-px bg-outline-variant/70 mx-1" aria-hidden="true" />

                {/* Add Your Business - Desktop Card Pill (only shown when not signed in) */}
                <Link
                  href="/business/add"
                  className="group hidden sm:inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-white py-1.5 pl-2 pr-3.5 shadow-xs transition-all duration-200 hover:border-primary/50 hover:bg-surface-container-low hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                      add_business
                    </span>
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="text-sm font-bold leading-tight text-on-surface transition-colors group-hover:text-primary">
                      Add Your Business
                    </span>
                    <span className="text-xs leading-tight text-on-surface-variant">
                      List your place on Cafnet
                    </span>
                  </div>

                  <span
                    className="material-symbols-outlined ml-1 text-[20px] text-on-surface-variant/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  >
                    chevron_right
                  </span>
                </Link>
              </>
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
                <div className="mt-3 space-y-2">
                  {/* Clickable Profile Card -> /account */}
                  <Link
                    href="/account"
                    onClick={closeMobileMenu}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/80 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-primary-container/20 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-base font-bold text-primary transition-transform group-hover:scale-105">
                        {currentUser?.avatar || "A"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-on-surface transition-colors group-hover:text-primary">
                          {currentUser?.name || "Personal Account"}
                        </p>
                        <p className="truncate text-xs text-on-surface-variant">
                          {currentUser?.phone || currentUser?.email || "View account"}
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[19px] text-outline-variant transition-colors group-hover:text-primary shrink-0" aria-hidden="true">
                      chevron_right
                    </span>
                  </Link>

                  {/* My Business Account - ONLY if user has added/managed a business */}
                  {hasBusinesses && (
                    <Link
                      href="/business/dashboard"
                      onClick={closeMobileMenu}
                      className="group flex items-center justify-between gap-3 rounded-xl p-2.5 transition-colors hover:bg-surface-container-low"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          <span className="material-symbols-outlined text-[19px]">storefront</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-on-surface group-hover:text-primary">
                            My Business Account
                          </p>
                          <p className="truncate text-xs text-on-surface-variant">
                            Manage your business listings
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline-variant text-[18px] transition-colors group-hover:text-primary shrink-0">
                        chevron_right
                      </span>
                    </Link>
                  )}

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
                <div className="mt-4 flex flex-col gap-2.5">
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white cursor-pointer"
                    onClick={() => {
                      startSignIn();
                      closeMobileMenu();
                    }}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-outline-variant bg-white text-sm font-semibold text-on-surface hover:bg-surface-container-low cursor-pointer"
                    onClick={() => {
                      startSignUp();
                      closeMobileMenu();
                    }}
                  >
                    Create account
                  </button>
                </div>
              )}
            </div>

            <div className="border-b border-outline-variant py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business</p>
              <Link
                href="/business/add"
                onClick={closeMobileMenu}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-surface-container-low/70 p-3.5 transition-all duration-200 hover:border-primary/50 hover:bg-primary-container/30 active:scale-[0.98]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                      add_business
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-on-surface transition-colors group-hover:text-primary">
                      Add Your Business
                    </span>
                    <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                      List your place on Cafnet
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined shrink-0 text-[20px] text-on-surface-variant/70 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true">
                  chevron_right
                </span>
              </Link>
            </div>

          </aside>
        </div>
      )}
    </header>
  );
}
