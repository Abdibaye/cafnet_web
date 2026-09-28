import type { Metadata } from "next";
import CustomerCollectionPage from "@/components/CustomerCollectionPage";

export const metadata: Metadata = {
  title: "Following — Cafnet",
  description: "Businesses you follow on Cafnet.",
};

export default function FollowingPage() {
  return <CustomerCollectionPage kind="following" />;
}