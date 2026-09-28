import type { Metadata } from "next";
import AdminClaimDetailPage from "@/components/admin/AdminClaimDetailPage";

export const metadata: Metadata = {
  title: "Review Claim — Cafnet Admin",
  description: "Review and make a decision on a business ownership claim.",
};

export default async function AdminClaimDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminClaimDetailPage claimId={id} />;
}
