import type { Metadata } from "next";
import BusinessReservationsPage from "@/components/business/BusinessReservationsPage";
import { getBusinessProfile } from "@/lib/api/businesses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const profile = await getBusinessProfile(id);
    if (profile?.business) {
      return {
        title: `Manage Reservations — ${profile.business.name} | Cafnet Business Center`,
        description: `Review, confirm, or decline table booking requests for ${profile.business.name}.`,
      };
    }
  } catch {
    // Business not found
  }

  return {
    title: "Manage Reservations | Cafnet",
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
