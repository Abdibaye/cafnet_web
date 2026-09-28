import type { Metadata } from "next";
import AdminReviewDetailPage from "@/components/admin/AdminReviewDetailPage";

export const metadata: Metadata = {
  title: "Review Moderation — Cafnet Admin",
  description: "Inspect reported review and take moderation action.",
};

export default async function AdminReviewDetailRoute({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  return <AdminReviewDetailPage reviewId={reviewId} />;
}
