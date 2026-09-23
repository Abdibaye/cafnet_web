import Link from "next/link";

export default function PartnerBanner() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f172a] via-[#172554] to-slate-900 text-white p-8 md:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-[#2563EB]/20">
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-[#2563EB]/20 border border-[#2563EB]/40 text-[#b7c4ff] text-xs font-bold tracking-wider uppercase mb-3">
              Partner with Cafnet
            </span>
            <h2 className="font-headline-lg text-2xl md:text-3xl font-bold">
              Run a restaurant, cafe, or lounge in Ethiopia?
            </h2>
            <p className="text-white/80 mt-2 text-sm md:text-base leading-relaxed">
              Claim your page on Cafnet for free to post updates, publish live menus, announce fasting specials, and connect with 50,000+ local diners.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              className="px-6 py-3.5 rounded-full bg-[#E05A47] hover:bg-[#c44937] font-label-md font-bold text-white shadow-lg transition-all text-center"
              href="/claim-restaurant"
            >
              Claim Your Restaurant
            </Link>
            <Link
              className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-label-md font-semibold transition-all text-center"
              href="/how-it-works"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
