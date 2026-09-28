import type { Metadata } from "next";
import CustomerCollectionPage from "@/components/CustomerCollectionPage";

export const metadata: Metadata = {
  title: "Saved Places — Cafnet",
  description: "Your saved restaurants, cafés, and drinks spots.",
};

export default function SavedPage() {
  return <CustomerCollectionPage kind="saved" />;
}