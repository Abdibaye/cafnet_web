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

  const isPrimaryActive = (href: string) => href === "/explore"
    ? pathname === "/" || pathname.startsWith("/explore")
    : pathname === href || pathname.startsWith(`${href}/`);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const signOut = () => {
    logout();
    setIsAccountOpen(false);
    router.push("/explore");
  };

  return <header className="fixed inset-x-0 top-0 z-50 bg-white">
    <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 border-b border-transparent px-5 md:h-20 md:gap-7 md:px-6 lg:px-12">
      <Link className="flex shrink-0 items-center py-2" href="/" aria-label="Cafnet home"><img alt="Cafnet Logo - Royal Blue & Coral" className="h-9 w-auto object-contain md:h-14" src="/images/logo.png" /></Link>
      <nav className="hidden h-full flex-1 items-center justify-center gap-6 md:flex lg:gap-7" aria-label="Primary navigation">
        <Link className={`relative inline-flex h-full items-center text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${isPrimaryActive("/explore") ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"}`} href="/explore">Explore</Link>
        {navItems.map((item) => <Link key={item.href} className={`relative inline-flex h-full items-center text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:transition-opacity ${isPrimaryActive(item.href) ? "text-primary after:opacity-100" : "text-on-surface hover:text-primary after:opacity-0"}`} href={item.href}>{item.label}</Link>)}
      </nav>
      <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-5">
        <Link className="hidden text-sm font-medium text-primary transition-colors hover:text-primary/75 lg:inline-flex" href="/business">For businesses</Link>
        <div ref={languageRef} className="relative hidden sm:block"><button type="button" aria-expanded={isLanguageOpen} aria-haspopup="menu" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-on-surface transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" onClick={() => setIsLanguageOpen((open) => !open)}>EN<span className="material-symbols-outlined text-[16px]" aria-hidden="true">expand_more</span></button>{isLanguageOpen && <div className="absolute right-0 top-full mt-2 min-w-40 border border-outline-variant bg-white p-1 shadow-sm" role="menu" aria-label="Language"><div className="px-3 py-2 text-sm font-semibold text-on-surface" role="menuitem">English <span className="ml-1 text-xs font-normal text-on-surface-variant">current</span></div><p className="px-3 pb-2 text-xs leading-5 text-on-surface-variant">More languages are coming soon.</p></div>}</div>
        {authReady && (isAuthenticated ? <div ref={accountRef} className="relative"><button type="button" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-primary" aria-expanded={isAccountOpen} aria-haspopup="menu" onClick={() => setIsAccountOpen((open) => !open)}><span className="flex size-8 items-center justify-center rounded-full bg-primary-container text-primary">{currentUser?.avatar}</span><span className="hidden lg:inline">Account</span><span className="material-symbols-outlined hidden text-[16px] lg:inline" aria-hidden="true">expand_more</span></button>{isAccountOpen && <div className="absolute right-0 top-full mt-2 min-w-48 border border-outline-variant bg-white p-1 shadow-sm" role="menu" aria-label="Account"><Link className="block px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary" href="/account" role="menuitem" onClick={() => setIsAccountOpen(false)}>My account</Link><Link className="block px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary" href="/saved" role="menuitem" onClick={() => setIsAccountOpen(false)}>Saved places</Link><Link className="block px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary" href="/following" role="menuitem" onClick={() => setIsAccountOpen(false)}>Following</Link><Link className="block px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary" href="/business/dashboard" role="menuitem" onClick={() => setIsAccountOpen(false)}>My businesses</Link><Link className="block px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-low hover:text-primary" href="/account/settings" role="menuitem" onClick={() => setIsAccountOpen(false)}>Settings</Link><button type="button" className="block w-full border-t border-outline-variant px-3 py-2.5 text-left text-sm text-secondary hover:bg-surface-container-low" role="menuitem" onClick={signOut}>Sign out</button></div>}</div> : <button type="button" className="hidden min-h-10 text-sm font-semibold text-primary hover:text-primary/75 focus-visible:outline-2 focus-visible:outline-primary sm:inline-flex" onClick={startSignIn}>Sign in</button>)}
        <button type="button" className="inline-flex size-10 items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-low focus-visible:outline-2 focus-visible:outline-primary md:hidden" aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen} onClick={() => setIsMobileMenuOpen((open) => !open)}><span className="material-symbols-outlined text-[23px]" aria-hidden="true">{isMobileMenuOpen ? "close" : "menu"}</span></button>
      </div>
    </div>
    {isMobileMenuOpen && <div className="fixed inset-0 top-16 z-40 bg-on-surface/20 md:hidden" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMobileMenu(); }}><aside className="ml-auto h-full w-[min(22rem,88vw)] overflow-y-auto bg-background px-5 pb-10 pt-6 shadow-[-8px_0_24px_rgba(20,33,61,0.12)]" role="dialog" aria-label="Utility menu"><div className="border-b border-outline-variant pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Account</p>{isAuthenticated ? <div className="mt-3 space-y-1"><Link className="block py-2.5 text-sm font-semibold text-on-surface" href="/account" onClick={closeMobileMenu}>My account</Link><Link className="block py-2.5 text-sm text-on-surface" href="/saved" onClick={closeMobileMenu}>Saved places</Link><Link className="block py-2.5 text-sm text-on-surface" href="/following" onClick={closeMobileMenu}>Following</Link><Link className="block py-2.5 text-sm text-on-surface" href="/business/dashboard" onClick={closeMobileMenu}>My businesses</Link><Link className="block py-2.5 text-sm text-on-surface" href="/account/settings" onClick={closeMobileMenu}>Settings</Link><button type="button" className="block py-2.5 text-sm font-semibold text-secondary" onClick={() => { signOut(); closeMobileMenu(); }}>Sign out</button></div> : <button type="button" className="mt-3 py-2.5 text-sm font-semibold text-primary" onClick={() => { startSignIn(); closeMobileMenu(); }}>Sign in</button>}</div><div className="border-b border-outline-variant py-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Business</p><Link className="mt-3 block py-2.5 text-sm font-semibold text-on-surface" href="/business" onClick={closeMobileMenu}>For businesses</Link></div><div className="py-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Preferences</p><p className="mt-3 py-2.5 text-sm text-on-surface">English</p></div></aside></div>}
  </header>;
}
