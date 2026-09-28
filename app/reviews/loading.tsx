import CollectionSkeleton from "@/components/skeletons/CollectionSkeleton";

export default function ReviewsLoading() {
  return <CollectionSkeleton title="My reviews" count={3} layout="list" />;
}
