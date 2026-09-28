import type { Metadata } from "next";
import AdminBusinessesPage from "@/components/admin/AdminBusinessesPage";

export const metadata: Metadata = {
  title: "Businesses — Cafnet Admin",
  description: "View and inspect all businesses on Cafnet.",
};

export default function AdminBusinessesRoute() {
  return <AdminBusinessesPage />;
}
