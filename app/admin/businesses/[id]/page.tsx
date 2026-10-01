import type { Metadata } from "next";
import AdminBusinessDetailPage from "@/components/admin/AdminBusinessDetailPage";
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
        title: `Inspect ${profile.business.name} — Cafnet Admin`,
      };
    }
  } catch {
    // Not found
  }

  return {
    title: "Business Detail — Cafnet Admin",
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
