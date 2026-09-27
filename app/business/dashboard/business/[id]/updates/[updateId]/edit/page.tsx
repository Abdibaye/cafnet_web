import EditUpdatePage from "@/components/EditUpdatePage";

export default async function EditUpdateRoute({ params }: { params: Promise<{ id: string; updateId: string }> }) {
  const { id, updateId } = await params;
  return <EditUpdatePage businessId={id} updateId={updateId} />;
}
