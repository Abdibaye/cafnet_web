"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Explore", href: "/explore", icon: "explore" },
  { label: "Restaurants", href: "/restaurants", icon: "restaurant" },
  { label: "Assistant", href: "/assistant", icon: "auto_awesome" },
  { label: "Cafés", href: "/cafes", icon: "local_cafe" },
  { label: "Drinks", href: "/drinks", icon: "local_bar" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur shadow-[0_-2px_10px_rgba(20,33,61,0.06)] md:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto grid h-[68px] max-w-lg grid-cols-5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex min-h-[48px] min-w-0 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-semibold transition-colors ${
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {item.icon}
              </span>
              <span className="max-w-full truncate leading-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
