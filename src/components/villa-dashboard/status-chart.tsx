"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartSkeleton } from "@/components/charts/chart-skeleton";

const VillaStatusChartBody = dynamic(() => import("./status-chart-body"), {
  ssr: false,
  loading: () => <ChartSkeleton height={250} />,
});

const COLORS: Record<string, string> = {
  PENDING: "#EAB308",
  IN_PROGRESS: "#3B82F6",
  COMPLETED: "#22C55E",
  REJECTED: "#EF4444",
};

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Resolved",
  REJECTED: "Rejected",
};

export function VillaStatusChart({ data }: { data: Record<string, number> }) {
  const chartData = Object.entries(data)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({
      name: LABELS[status] || status,
      value: count,
      color: COLORS[status] || "#6B7280",
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
            No data yet
          </div>
        ) : (
          <VillaStatusChartBody data={chartData} />
        )}
      </CardContent>
    </Card>
  );
}
