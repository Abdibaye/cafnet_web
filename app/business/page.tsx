import Link from "next/link";

const benefits = [
  ["Keep information updated", "Update hours, phone number, location, photos, and other important details."],
  ["Reach customers", "Help people discover your business when they are looking for somewhere to eat."],
  ["Share updates", "Publish important offers, new menu information, and news when the time is right."],
  ["Manage your presence", "Keep your Cafnet listing accurate for the people planning a visit."],
];

export default function BusinessLandingPage() {
  return <div className="mx-auto max-w-5xl px-5 py-12 lg:px-12 lg:py-20"><section className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">For businesses</p><h1 className="mt-3 text-4xl font-bold leading-tight text-on-surface md:text-5xl">Is your business on Cafnet?</h1><p className="mt-5 max-w-xl text-base leading-7 text-on-surface-variant">Claim your listing to keep your information up to date and help customers find you.</p><div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><Link href="/business/claim" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white hover:bg-[#0f46b8]">Find my business</Link><Link href="/business/add" className="inline-flex h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold text-primary hover:bg-primary-container">Can&apos;t find your business? Add it</Link></div></section><section className="mt-20 border-t border-outline-variant pt-10"><h2 className="text-2xl font-bold text-on-surface">What claiming provides</h2><div className="mt-7 grid gap-4 sm:grid-cols-2">{benefits.map(([title, text], index) => <article key={title} className="border border-outline-variant bg-white p-5"><span className="text-sm font-bold text-secondary">0{index + 1}</span><h3 className="mt-3 font-semibold text-on-surface">{title}</h3><p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p></article>)}</div></section></div>;
}
