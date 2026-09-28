import type { Metadata } from "next";
import AdminSubmissionsPage from "@/components/admin/AdminSubmissionsPage";

export const metadata: Metadata = {
  title: "Business Submissions — Cafnet Admin",
  description: "Review and approve new restaurant and cafe submissions.",
};

export default function AdminSubmissionsRoute() {
  return <AdminSubmissionsPage />;
}
