import EditBusinessPage from "@/components/EditBusinessPage";

export default async function EditBusinessRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditBusinessPage businessId={id} />;
}
