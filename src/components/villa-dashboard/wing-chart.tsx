"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

const VillaWingChartBody = dynamic(() => import("./wing-chart-body"), {
  ssr: false,
  loading: () => <ChartSkeleton height={250} />,
});

interface WingChartProps {
  data: { name: string; count: number }[];
}

export function VillaWingChart({ data }: WingChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Issues by Wing</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
            No wing data yet
          </div>
        ) : (
          <VillaWingChartBody data={data} />
        )}
      </CardContent>
    </Card>
  );
}
