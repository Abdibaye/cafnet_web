import type { Metadata } from "next";
import AdminClaimsPage from "@/components/admin/AdminClaimsPage";

export const metadata: Metadata = {
  title: "Business Claims — Cafnet Admin",
  description: "Review and approve ownership claims for listed businesses.",
};

export default function AdminClaimsRoute() {
  return <AdminClaimsPage />;
}
