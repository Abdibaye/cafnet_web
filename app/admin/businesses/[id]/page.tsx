import type { Metadata } from "next";
import AdminBusinessDetailPage from "@/components/admin/AdminBusinessDetailPage";


export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inspect Business — Cafnet Admin",
  description: "Administrative inspection, verification, and menu taxonomy management for Cafnet businesses.",
};

export default async function AdminBusinessDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminBusinessDetailPage businessId={id} />;
}

