import type { Metadata } from "next";
import AdminReportsPage from "@/components/admin/AdminReportsPage";

export const metadata: Metadata = {
  title: "Business Reports | Cafnet Admin Center",
  description: "Review and act upon customer reports regarding business information accuracy.",
};

export default function AdminReportsRoute() {
  return <AdminReportsPage />;
}
