"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

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
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => [`${value} issues`, ""]} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#22C55E"
                strokeWidth={2}
                dot={{ r: 3, fill: "#22C55E" }}
                activeDot={{ r: 5 }}
                name="Issues"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
