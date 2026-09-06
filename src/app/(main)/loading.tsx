import { SkeletonPageHeading, SkeletonTable } from "@/components/ui/skeleton";

/**
 * Group-wide fallback. Its real job is to let the sidebar, header and page
 * shell paint immediately while a route's server data is still loading —
 * without it, navigation blocks on the slowest query before anything appears.
 * Individual routes override this with a closer-fitting skeleton.
 */
export default function MainLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <SkeletonPageHeading />
      <SkeletonTable />
    </div>
  );
}
