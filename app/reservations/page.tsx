import type { Metadata } from "next";
import ReservationsPage from "@/components/ReservationsPage";

export const metadata: Metadata = {
  title: "Reservations — Cafnet",
  description: "View and manage your restaurant reservations.",
};

export default function ReservationsRoute() {
  return <ReservationsPage />;
}