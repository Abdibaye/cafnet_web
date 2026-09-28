import type { Metadata } from "next";
import ManageMenuPage from "@/components/ManageMenuPage";
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
      title: "Manage Menu | Cafnet",
    };
  }

  return {
    title: `Manage Menu — ${business.name} | Cafnet Business Center`,
    description: `Update dishes, categories, and prices for ${business.name}.`,
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
