import CollectionSkeleton from "@/components/skeletons/CollectionSkeleton";

export default function ReservationsLoading() {
  return <CollectionSkeleton title="My reservations" count={4} layout="list" />;
}
