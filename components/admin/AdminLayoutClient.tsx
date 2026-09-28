"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isAdminAuthenticated, loginAdmin, logoutAdmin } from "@/data/adminStorage";
import { useCustomer } from "@/components/CustomerProvider";

type AdminLayoutClientProps = {
  children: React.ReactNode;
};

export default function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useCustomer();
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthenticated(isAdminAuthenticated());
    };
    window.addEventListener("cafnet:admin-auth-updated", handleAuthChange);
    return () => window.removeEventListener("cafnet:admin-auth-updated", handleAuthChange);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogin = () => {
    loginAdmin();
    setAuthenticated(true);
    showToast("Signed in as Cafnet Administrator");
  };

  const handleLogout = () => {
    logoutAdmin();
    setAuthenticated(false);
    showToast("Signed out of Admin Center");
  };

  // -------------------------------------------------------------
  // Unauthorized Barrier
  // -------------------------------------------------------------
  if (!authenticated) {
    return (
      <div className="flex min-h-[85vh] w-full flex-col items-center justify-center bg-background px-5 py-16">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-outline-variant bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-surface-container-low text-secondary">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>

          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
            Cafnet Governance
          </p>
          <h1 className="mt-2 text-2xl font-bold text-on-surface">Admin access required</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            This area is restricted to Cafnet staff and platform administrators.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0f46b8]"
            >
              <span className="material-symbols-outlined text-[19px]">lock_open</span>
              Sign in as Admin
            </button>
            <Link
              href="/"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-outline-variant bg-white px-5 text-sm font-semibold text-on-surface transition-colors hover:border-primary/40 hover:text-primary"
            >
              Back to Cafnet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Navigation Links
  // -------------------------------------------------------------
  const navItems = [
    { label: "Overview", href: "/admin", icon: "dashboard", exact: true },
    { label: "Businesses", href: "/admin/businesses", icon: "storefront", exact: false },
    { label: "Claims", href: "/admin/claims", icon: "assignment_ind", exact: false },
    { label: "Submissions", href: "/admin/submissions", icon: "post_add", exact: false },
    { label: "Reviews", href: "/admin/reviews", icon: "rate_review", exact: false },
  ];

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background lg:flex-row">
      {/* ------------------------------------------------------------- */}
      {/* Desktop Sidebar */}
      {/* ------------------------------------------------------------- */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-outline-variant bg-white lg:flex">
        {/* Brand bar */}
        <div className="flex h-16 items-center justify-between border-b border-outline-variant px-6">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-on-surface">Cafnet</span>
            <span className="rounded-md bg-secondary/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
              Admin
            </span>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 p-4" aria-label="Admin navigation">
          {navItems.map((item) => {
            const active = isLinkActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="border-t border-outline-variant p-4">
          <Link
            href="/"
            className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            View customer app
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-xs font-semibold text-secondary hover:bg-red-50 hover:text-red-600"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Exit admin mode
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* Mobile Header & Drawer */}
      {/* ------------------------------------------------------------- */}
      <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-white px-5 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-on-surface">Cafnet</span>
          <span className="rounded-md bg-secondary/15 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
            Admin
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex size-10 items-center justify-center rounded-xl border border-outline-variant text-on-surface"
          aria-label="Toggle admin menu"
        >
          <span className="material-symbols-outlined text-2xl">
            {mobileMenuOpen ? "close" : "menu"}
          </span>
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-outline-variant bg-white p-4 shadow-md lg:hidden">
          <nav className="space-y-1" aria-label="Mobile admin navigation">
            {navItems.map((item) => {
              const active = isLinkActive(item.href, item.exact);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-3 border-t border-outline-variant pt-3">
            <Link
              href="/"
              className="flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              View customer app
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 flex h-10 w-full items-center gap-2 rounded-xl px-3 text-xs font-semibold text-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Exit admin mode
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* Main Admin Page Content */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 overflow-x-hidden p-5 sm:p-8 lg:p-12">{children}</main>
    </div>
  );
}
