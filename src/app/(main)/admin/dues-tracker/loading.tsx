import {
  SkeletonCards,
  SkeletonPageHeading,
  SkeletonTable,
} from "@/components/ui/skeleton";

export default function DuesTrackerLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeading />
      <SkeletonCards count={5} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-5" />
      <SkeletonTable rows={12} />
    </div>
  );
}
