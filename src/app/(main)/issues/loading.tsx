import { Skeleton, SkeletonPageHeading } from "@/components/ui/skeleton";

export default function IssuesLoading() {
  return (
    <div className="space-y-6">
      <SkeletonPageHeading />
      <Skeleton className="h-12 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-3 w-full" />
            <Skeleton className="mt-2 h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
