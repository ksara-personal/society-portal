/**
 * Placeholder shown while a chart's recharts bundle is being fetched. It
 * reserves the chart's exact height so the card doesn't jump when the real
 * chart mounts.
 */
export function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center rounded-md bg-gray-50"
      aria-hidden="true"
    >
      <div className="h-2 w-24 animate-pulse rounded-full bg-gray-200" />
    </div>
  );
}
