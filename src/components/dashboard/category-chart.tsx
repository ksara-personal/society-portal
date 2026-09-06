"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

const CategoryChartBody = dynamic(() => import("./category-chart-body"), {
  ssr: false,
  loading: () => <ChartSkeleton height={250} />,
});

export function CategoryChart({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Issues by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
            No data yet
          </div>
        ) : (
          <CategoryChartBody data={data} />
        )}
      </CardContent>
    </Card>
  );
}
