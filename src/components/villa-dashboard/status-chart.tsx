"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

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

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
            No data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              paddingAngle={3}
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} issues`, ""]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
