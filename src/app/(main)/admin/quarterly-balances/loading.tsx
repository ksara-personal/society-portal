import { SkeletonPageHeading, SkeletonTable } from "@/components/ui/skeleton";

export default function QuarterlyBalancesLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeading />
      <SkeletonTable rows={6} />
    </div>
  );
}
