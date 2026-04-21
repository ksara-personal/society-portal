import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Clock, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { formatHours } from "@/lib/utils";

interface KpiCardsProps {
  total: number;
  statusCounts: Record<string, number>;
  avgResolutionDays: number | null;
}

export function KpiCards({ total, statusCounts, avgResolutionDays }: KpiCardsProps) {
  const pct = (n: number) =>
    total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

  const cards = [
    {
      title: "Total Issues",
      value: total,
      icon: BarChart3,
      color: "text-gray-700",
      bg: "bg-gray-100",
    },
    {
      title: "Pending",
      value: statusCounts.PENDING ?? 0,
      subtitle: pct(statusCounts.PENDING ?? 0),
      icon: AlertCircle,
      color: "text-yellow-700",
      bg: "bg-yellow-100",
    },
    {
      title: "In Progress",
      value: statusCounts.IN_PROGRESS ?? 0,
      subtitle: pct(statusCounts.IN_PROGRESS ?? 0),
      icon: Clock,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      title: "Completed",
      value: statusCounts.COMPLETED ?? 0,
      subtitle: pct(statusCounts.COMPLETED ?? 0),
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      title: "Avg Resolution",
      value: avgResolutionDays
        ? `${Math.round(avgResolutionDays)}d`
        : "N/A",
      subtitle: avgResolutionDays ? "avg days" : "no data yet",
      icon: Clock,
      color: "text-purple-700",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{card.title}</p>
              <div className={`p-1.5 rounded-md ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-gray-400 mt-0.5">{card.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
