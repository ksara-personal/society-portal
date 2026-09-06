"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CategoryChartBody({
  data,
}: {
  data: Array<{ name: string; count: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          tick={{ fontSize: 12 }}
        />
        <Tooltip formatter={(value) => [`${value} issues`, ""]} />
        <Bar dataKey="count" fill="#22C55E" radius={[0, 4, 4, 0]} name="Issues" />
      </BarChart>
    </ResponsiveContainer>
  );
}
