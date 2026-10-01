import type { Metadata } from "next";
import ManageMenuPage from "@/components/ManageMenuPage";
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
        title: `Manage Menu — ${profile.business.name} | Cafnet Business Center`,
        description: `Update dishes, categories, and prices for ${profile.business.name}.`,
      };
    }
  } catch {
    // Business not found
  }

  return {
    title: "Manage Menu | Cafnet",
  };
}

export default async function ManageMenuRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManageMenuPage businessId={id} />;
}
