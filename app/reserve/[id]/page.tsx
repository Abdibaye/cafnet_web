import Link from "next/link";
import ReservationFlow from "@/components/ReservationFlow";
import { getBusinessById } from "@/data/mockBusinesses";

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = getBusinessById(id);
  if (!business) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Business not found</h1><Link href="/explore" className="mt-6 inline-flex text-sm font-semibold text-primary">Explore restaurants</Link></div>;
  if (!business.reservationAvailable) return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><h1 className="text-2xl font-bold text-on-surface">Reservations are not available</h1><p className="mt-3 text-sm text-on-surface-variant">This business does not currently accept reservations through Cafnet.</p><Link href={`/business/${business.id}`} className="mt-6 inline-flex text-sm font-semibold text-primary">View restaurant</Link></div>;
  return <ReservationFlow business={business} />;
}