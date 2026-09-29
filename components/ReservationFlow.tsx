"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCustomer } from "@/components/CustomerProvider";
import { useReservations } from "@/components/ReservationProvider";
import type { MockBusiness } from "@/data/mockBusinesses";

const availableTimes = ["7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"];
const unavailableTimes = new Set(["8:00 PM"]);

function dateOptions() {
  const options: { value: string; label: string; detail: string }[] = [];
  for (let offset = 0; offset < 4; offset += 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    options.push({ value: date.toISOString().slice(0, 10), label: offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" }), detail: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
  }
  return options;
}

type ReservationFlowProps = { business: MockBusiness };

export default function ReservationFlow({ business }: ReservationFlowProps) {
  const dates = useMemo(() => dateOptions(), []);
  const { isAuthenticated, startSignIn } = useCustomer();
  const { createReservation } = useReservations();
  const [date, setDate] = useState(dates[0].value);
  const [time, setTime] = useState("7:00 PM");
  const [partySize, setPartySize] = useState(2);
  const [specialRequest, setSpecialRequest] = useState("");
  const [step, setStep] = useState<"form" | "review" | "confirmed">("form");
  const [reservationId, setReservationId] = useState("");

  const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const confirm = () => {
    if (!isAuthenticated) {
      startSignIn();
      return;
    }
    const reservation = createReservation({ businessId: business.id, date, time, partySize, specialRequest: specialRequest.trim() });
    if (reservation) {
      setReservationId(reservation.id);
      setStep("confirmed");
    }
  };

  if (step === "confirmed") return <div className="mx-auto max-w-2xl px-5 py-10 lg:py-16"><div className="border border-outline-variant bg-white p-6 sm:p-8"><span className="material-symbols-outlined text-3xl text-secondary" aria-hidden="true">schedule</span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Cafnet reservation</p><h1 className="mt-2 text-3xl font-bold text-on-surface">Reservation requested</h1><p className="mt-3 text-sm leading-6 text-on-surface-variant">Your reservation request has been submitted to {business.name}. The restaurant team will review and confirm your table booking.</p><div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200"><span className="material-symbols-outlined text-[16px]">schedule</span>Status: Pending confirmation</div><h2 className="mt-7 text-lg font-bold text-on-surface">{business.name}</h2><div className="mt-4 space-y-2 text-sm text-on-surface-variant"><p>{formattedDate}</p><p>{time}</p><p>{partySize} {partySize === 1 ? "person" : "people"}</p></div><p className="mt-6 text-sm font-semibold text-on-surface">Reservation ID <span className="ml-2 text-primary">{reservationId}</span></p><div className="mt-8 flex flex-wrap gap-3"><Link href={`/reservations/${reservationId}`} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-[#0f46b8]">View reservation</Link><Link href={`/business/${business.id}`} className="inline-flex h-11 items-center rounded-xl border border-outline-variant px-5 text-sm font-semibold text-on-surface hover:border-primary/40 hover:text-primary">View restaurant</Link></div></div></div>;

  if (step === "review") return <div className="mx-auto max-w-2xl px-5 py-10 lg:py-16"><button type="button" className="text-sm font-semibold text-primary" onClick={() => setStep("form")}>← Edit reservation</button><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Review reservation</p><h1 className="mt-2 text-3xl font-bold text-on-surface">{business.name}</h1><section className="mt-8 divide-y divide-outline-variant border border-outline-variant bg-white"><div className="p-5"><p className="text-xs text-on-surface-variant">Date</p><p className="mt-1 font-semibold text-on-surface">{formattedDate}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Time</p><p className="mt-1 font-semibold text-on-surface">{time}</p></div><div className="p-5"><p className="text-xs text-on-surface-variant">Guests</p><p className="mt-1 font-semibold text-on-surface">{partySize} {partySize === 1 ? "person" : "people"}</p></div>{specialRequest.trim() && <div className="p-5"><p className="text-xs text-on-surface-variant">Special request</p><p className="mt-1 font-semibold text-on-surface">{specialRequest.trim()}</p></div>}</section><p className="mt-4 text-xs leading-5 text-on-surface-variant">The restaurant will confirm availability for your table request.</p><button type="button" className="mt-6 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={confirm}>Request reservation</button></div>;

  return <div className="mx-auto max-w-2xl px-5 py-10 lg:py-16"><Link href={`/business/${business.id}`} className="text-sm font-semibold text-primary">← {business.name}</Link><p className="mt-10 text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Reserve a table</p><h1 className="mt-2 text-3xl font-bold text-on-surface">Plan your visit</h1><p className="mt-3 text-sm text-on-surface-variant">Choose a date, time, and party size to submit your reservation request.</p><section className="mt-8"><h2 className="text-sm font-semibold text-on-surface">Date</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{dates.map((option) => <button key={option.value} type="button" className={`border px-3 py-3 text-left text-sm ${date === option.value ? "border-primary bg-primary-container text-primary" : "border-outline-variant bg-white text-on-surface hover:border-primary/40"}`} onClick={() => setDate(option.value)}><span className="block font-semibold">{option.label}</span><span className="mt-1 block text-xs opacity-75">{option.detail}</span></button>)}</div></section><section className="mt-8"><h2 className="text-sm font-semibold text-on-surface">Guests</h2><div className="mt-3 flex h-12 w-full max-w-xs items-center justify-between border border-outline-variant bg-white px-3"><button type="button" className="flex size-8 items-center justify-center rounded-lg text-lg text-primary hover:bg-primary-container disabled:text-outline" aria-label="Remove guest" disabled={partySize === 1} onClick={() => setPartySize((current) => Math.max(1, current - 1))}>−</button><span className="text-sm font-semibold text-on-surface">{partySize} {partySize === 1 ? "person" : "people"}</span><button type="button" className="flex size-8 items-center justify-center rounded-lg text-lg text-primary hover:bg-primary-container disabled:text-outline" aria-label="Add guest" disabled={partySize === 10} onClick={() => setPartySize((current) => Math.min(10, current + 1))}>+</button></div></section><section className="mt-8"><h2 className="text-sm font-semibold text-on-surface">Available times</h2><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">{availableTimes.map((slot) => { const unavailable = unavailableTimes.has(slot); return <button key={slot} type="button" disabled={unavailable} className={`h-11 border text-sm font-semibold ${time === slot && !unavailable ? "border-primary bg-primary-container text-primary" : unavailable ? "border-outline-variant bg-surface-container-low text-outline line-through" : "border-outline-variant bg-white text-on-surface hover:border-primary/40"}`} onClick={() => setTime(slot)}>{slot}</button>; })}</div><p className="mt-2 text-xs text-on-surface-variant">8:00 PM is currently fully booked.</p></section><section className="mt-8"><label htmlFor="special-request" className="text-sm font-semibold text-on-surface">Special request <span className="font-normal text-on-surface-variant">(optional)</span></label><textarea id="special-request" className="mt-3 min-h-24 w-full resize-y rounded-xl border border-outline-variant bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Birthday, window seat, dietary note, etc." value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} /></section><button type="button" className="mt-8 h-12 w-full rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#0f46b8]" onClick={() => setStep("review")}>Continue</button></div>;
}
