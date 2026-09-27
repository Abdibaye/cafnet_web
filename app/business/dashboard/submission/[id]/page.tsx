import BusinessStatusPage from "@/components/BusinessStatusPage";

export default async function SubmissionStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BusinessStatusPage kind="submission" submissionId={id} />;
}
