"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRANDING } from "@/config/branding";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

const VillaTrendChartBody = dynamic(() => import("./trend-chart-body"), {
  ssr: false,
  loading: () => <ChartSkeleton height={220} />,
});

interface TrendChartProps {
  data: { date: string; count: number }[];
}

export function VillaTrendChart({ data }: TrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{`${BRANDING.unitLabel} Issues — Last 30 Days`}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
            No issues in the last 30 days
          </div>
        ) : (
          <VillaTrendChartBody data={data} />
        )}
      </CardContent>
    </Card>
  );
}
