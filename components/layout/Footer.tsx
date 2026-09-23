import Link from "next/link";

const cities = [
  { name: "Addis Ababa", href: "/cities/addis-ababa" },
  { name: "Hawassa", href: "/cities/hawassa" },
  { name: "Bahir Dar", href: "/cities/bahir-dar" },
  { name: "Bishoftu", href: "/cities/bishoftu" },
  { name: "Adama (Nazret)", href: "/cities/adama" },
];

const cuisines = [
  { name: "Traditional Habesha", href: "/cuisines/habesha" },
  { name: "Specialty Coffee & Buna", href: "/cuisines/coffee" },
  { name: "Italian & Pizza", href: "/cuisines/italian" },
  { name: "Burgers & Grills", href: "/cuisines/burgers" },
  { name: "Fasting Vegan (Tsom)", href: "/cuisines/vegan" },
];

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-lowest border-t border-surface-container pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link className="inline-block mb-4" href="/">
              <img
                alt="Cafnet Logo - Royal Blue & Coral"
                className="h-9 w-auto object-contain"
                src="/images/logo.png"
              />
            </Link>
            <p className="text-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
              Cafnet is Ethiopia&apos;s premier dining network, bringing together culinary traditions, live menu tracking, and table reservations across the country.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Link
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-[#2563EB] transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">public</span>
              </Link>
              <Link
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-[#2563EB] transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
              </Link>
              <Link
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-[#2563EB] transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Ethiopian Cities
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              {cities.map((city) => (
                <li key={city.name}>
                  <Link
                    className="hover:text-[#2563EB] transition-colors"
                    href={city.href}
                  >
                    {city.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Popular Cuisines
            </h4>
            <ul className="space-y-2 text-xs text-on-surface-variant">
              {cuisines.map((cuisine) => (
                <li key={cuisine.name}>
                  <Link
                    className="hover:text-[#2563EB] transition-colors"
                    href={cuisine.href}
                  >
                    {cuisine.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-headline-sm text-xs font-bold uppercase tracking-wider text-on-surface mb-3">
              Get Cafnet App
            </h4>
            <p className="text-xs text-on-surface-variant mb-3">Order, reserve & follow kitchens anywhere.</p>
            <div className="space-y-2">
              <div className="px-3 py-2 rounded-xl bg-surface-container text-xs font-semibold flex items-center gap-2 text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[18px]">phone_iphone</span>
                App Store (iOS)
              </div>
              <div className="px-3 py-2 rounded-xl bg-surface-container text-xs font-semibold flex items-center gap-2 text-on-surface cursor-pointer hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-[18px]">android</span>
                Google Play
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-container flex flex-col md:flex-row items-center justify-between gap-4 text-on-surface-variant font-body-sm text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span>© 2025 Cafnet Hospitality Inc. All rights reserved.</span>
            <Link className="hover:text-on-surface transition-colors" href="/privacy">
              Privacy Policy
            </Link>
            <Link className="hover:text-on-surface transition-colors" href="/terms">
              Terms of Service
            </Link>
            <Link className="hover:text-on-surface transition-colors" href="/sitemap">
              Sitemap
            </Link>
          </div>
          <div className="flex items-center gap-6 font-label-md text-xs text-on-surface">
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#2563EB]">verified</span>
              Verified Discovery
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#E05A47]">award_star</span>
              Curated Dining
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
