import ManagedBusinessPage from "@/components/ManagedBusinessPage";

export default async function ManagedBusinessRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ManagedBusinessPage businessId={id} />;
}
