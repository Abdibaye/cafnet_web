import CreateUpdatePage from "@/components/CreateUpdatePage";

export default async function CreateUpdateRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CreateUpdatePage businessId={id} />;
}
