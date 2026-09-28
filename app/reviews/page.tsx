import type { Metadata } from "next";
import CustomerReviewsPage from "@/components/CustomerReviewsPage";

export const metadata: Metadata = {
  title: "Your Reviews — Cafnet",
  description: "Reviews you've written for restaurants, cafés, and more.",
};

export default function ReviewsRoute() {
  return <CustomerReviewsPage />;
}
