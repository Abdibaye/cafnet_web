import UpdateListPage from "@/components/UpdateListPage";

export default async function UpdatesRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <UpdateListPage businessId={id} />;
}
