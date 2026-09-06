"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function TrendChartBody({
  data,
}: {
  data: Array<{ date: string; count: number }>;
}) {
  return (
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
  );
}
