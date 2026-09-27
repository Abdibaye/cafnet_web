import ReservationDetailPage from "@/components/ReservationDetailPage";

export default async function ReservationDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReservationDetailPage reservationId={id} />;
}