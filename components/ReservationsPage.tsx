"use client";

import Link from "next/link";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import { getBusinessById } from "@/data/mockBusinesses";

export default function ReservationsPage() {
  const { authReady, isAuthenticated, startSignIn } = useCustomer();
  const { ready, reservations } = useReservations();
  if (!authReady || !ready) return <div className="mx-auto max-w-3xl px-5 py-20 text-sm text-on-surface-variant">Loading reservations...</div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Sign in to see your reservations</h1><p className="mt-3 text-sm text-on-surface-variant">Your Cafnet reservations will appear here.</p><button type="button" className="mt-6 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white" onClick={startSignIn}>Sign in</button></div>;
  const upcoming = reservations.filter((reservation) => reservation.status === "confirmed");
  const past = reservations.filter((reservation) => reservation.status === "cancelled");
  const section = (title: string, items: typeof reservations) => items.length > 0 && <section className="mt-8"><h2 className="text-lg font-bold text-on-surface">{title}</h2><div className="mt-3 divide-y divide-outline-variant border border-outline-variant bg-white">{items.map((reservation) => { const business = getBusinessById(reservation.businessId); return <Link key={reservation.id} href={`/reservations/${reservation.id}`} className="flex items-center justify-between gap-4 p-5 hover:bg-surface-container-low"><div><h3 className="font-semibold text-on-surface">{business?.name || "Business"}</h3><p className="mt-1 text-sm text-on-surface-variant">{new Date(`${reservation.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} · {reservation.time} · {reservation.partySize} people</p></div><span className={`shrink-0 text-xs font-semibold ${reservation.status === "confirmed" ? "text-primary" : "text-on-surface-variant"}`}>{reservation.status === "confirmed" ? "Confirmed" : "Cancelled"}</span></Link>; })}</div></section>;
  return <div className="mx-auto max-w-3xl px-5 py-10 lg:px-0 lg:py-16"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Your Cafnet</p><h1 className="mt-2 text-3xl font-bold text-on-surface">My reservations</h1>{reservations.length === 0 ? <div className="mt-10 border border-dashed border-outline-variant bg-white px-6 py-12 text-center"><h2 className="text-lg font-bold text-on-surface">No reservations yet.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-on-surface-variant">Find somewhere you&apos;d like to eat and your reservations will appear here.</p><Link href="/explore" className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white">Explore restaurants</Link></div> : <>{section("Upcoming", upcoming)}{section("Past", past)}</>}</div>;
}