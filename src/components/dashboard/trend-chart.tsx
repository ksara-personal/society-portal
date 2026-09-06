"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

const TrendChartBody = dynamic(() => import("./trend-chart-body"), {
  ssr: false,
  loading: () => <ChartSkeleton height={200} />,
});

export function TrendChart({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Issue Trend (Last 30 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
            No data for this period
          </div>
        ) : (
          <TrendChartBody data={data} />
        )}
      </CardContent>
    </Card>
  );
}
