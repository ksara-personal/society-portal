import {
  SkeletonCards,
  SkeletonPageHeading,
  SkeletonPanel,
} from "@/components/ui/skeleton";

export default function VillaDashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <SkeletonPageHeading />
      <SkeletonCards count={4} className="grid-cols-2 lg:grid-cols-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonPanel />
        <SkeletonPanel />
      </div>
      <SkeletonPanel />
    </div>
  );
}
