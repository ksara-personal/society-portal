import { Card, CardContent } from "@/components/ui/card";
import { Home, AlertCircle, CheckCircle2, Clock, Users } from "lucide-react";
import { BRANDING } from "@/config/branding";

interface VillaKpiCardsProps {
  total: number;
  statusCounts: Record<string, number>;
  uniqueVillasCount: number;
  avgResolutionDays: number | null;
}

export function VillaKpiCards({
  total,
  statusCounts,
  uniqueVillasCount,
  avgResolutionDays,
}: VillaKpiCardsProps) {
  const open = (statusCounts.PENDING ?? 0) + (statusCounts.IN_PROGRESS ?? 0);

  const cards = [
    {
      title: `Total ${BRANDING.unitLabel} Issues`,
      value: total,
      icon: Home,
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    {
      title: "Open",
      value: open,
      subtitle: total > 0 ? `${Math.round((open / total) * 100)}% of total` : undefined,
      icon: AlertCircle,
      color: "text-yellow-700",
      bg: "bg-yellow-100",
    },
    {
      title: "Resolved",
      value: statusCounts.COMPLETED ?? 0,
      subtitle: total > 0 ? `${Math.round(((statusCounts.COMPLETED ?? 0) / total) * 100)}%` : undefined,
      icon: CheckCircle2,
      color: "text-green-700",
      bg: "bg-green-100",
    },
    {
      title: `${BRANDING.unitLabel}s Reporting`,
      value: uniqueVillasCount,
      subtitle: "distinct residents",
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    {
      title: "Avg Resolution",
      value: avgResolutionDays ? `${Math.round(avgResolutionDays)}d` : "N/A",
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
