import { SkeletonPageHeading, SkeletonTable } from "@/components/ui/skeleton";

export default function FinanceSummaryLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeading />
      <SkeletonTable rows={8} />
    </div>
  );
}
