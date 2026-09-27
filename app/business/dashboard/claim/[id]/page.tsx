import BusinessStatusPage from "@/components/BusinessStatusPage";

export default async function ClaimStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessStatusPage kind="claim" claimId={id} />;
}
