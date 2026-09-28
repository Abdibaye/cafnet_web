import type { Metadata } from "next";
import BusinessReservationsPage from "@/components/business/BusinessReservationsPage";
import { getBusinessById } from "@/data/mockBusinesses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = getBusinessById(id);

  if (!business) {
    return {
      title: "Manage Reservations | Cafnet",
    };
  }

  return {
    title: `Manage Reservations — ${business.name} | Cafnet Business Center`,
    description: `Review, confirm, or decline table booking requests for ${business.name}.`,
  };
}

export default async function ManageReservationsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BusinessReservationsPage businessId={id} />;
}
