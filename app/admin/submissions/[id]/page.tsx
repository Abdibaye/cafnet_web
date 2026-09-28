import type { Metadata } from "next";
import AdminSubmissionDetailPage from "@/components/admin/AdminSubmissionDetailPage";

export const metadata: Metadata = {
  title: "Review Submission — Cafnet Admin",
  description: "Review and make a decision on a business listing submission.",
};

export default async function AdminSubmissionDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminSubmissionDetailPage submissionId={id} />;
}
