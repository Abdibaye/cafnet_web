import type { Metadata } from "next";
import AdminReportDetailPage from "@/components/admin/AdminReportDetailPage";
import { getBusinessReportById } from "@/data/businessReportStorage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reportId: string }>;
}): Promise<Metadata> {
  const { reportId } = await params;
  const report = getBusinessReportById(reportId);

  return {
    title: report
      ? `Review Report — ${report.businessName} | Cafnet Admin`
      : "Business Report Review | Cafnet Admin",
    description: "Review customer report and take administrative action.",
  };
}

export default async function AdminReportDetailRoute({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  return <AdminReportDetailPage reportId={reportId} />;
}
