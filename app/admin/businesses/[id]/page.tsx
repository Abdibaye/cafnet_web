import type { Metadata } from "next";
import AdminBusinessDetailPage from "@/components/admin/AdminBusinessDetailPage";
import { getBusinessById } from "@/data/mockBusinesses";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const business = getBusinessById(id);

  return {
    title: business ? `Inspect ${business.name} — Cafnet Admin` : "Business Detail — Cafnet Admin",
  };
}

export default async function AdminBusinessDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminBusinessDetailPage businessId={id} />;
}
