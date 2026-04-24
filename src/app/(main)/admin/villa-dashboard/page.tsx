import Link from "next/link";
import { format } from "date-fns";
import { getVillaDashboardStats } from "@/actions/villa-dashboard";
import { VillaKpiCards } from "@/components/villa-dashboard/kpi-cards";
import { VillaStatusChart } from "@/components/villa-dashboard/status-chart";
import { VillaWingChart } from "@/components/villa-dashboard/wing-chart";
import { VillaTrendChart } from "@/components/villa-dashboard/trend-chart";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, MapPin } from "lucide-react";

export default async function VillaDashboardPage() {
  const stats = await getVillaDashboardStats();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Home className="h-5 w-5 text-amber-600" />
          Villa Issues Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview of all resident villa-specific issues across Amber Meadows
        </p>
      </div>

      {/* KPI Cards */}
      <VillaKpiCards
        total={stats.total}
        statusCounts={stats.statusCounts}
        uniqueVillasCount={stats.uniqueVillasCount}
        avgResolutionDays={stats.avgResolutionDays}
      />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <VillaStatusChart data={stats.statusCounts} />
        <VillaWingChart data={stats.wingData} />
      </div>

      {/* Trend */}
      <VillaTrendChart data={stats.trendData} />

      {/* Bottom row: Top flats + Recent issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top reporting flats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-600" />
              Top Reporting Residents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.flatData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.flatData.map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm text-gray-700 truncate flex-1 pr-3">{row.label}</span>
                    <span className="text-sm font-semibold text-amber-700 shrink-0">
                      {row.count} issue{row.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent villa issues */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Villa Issues</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentIssues.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No villa issues yet</p>
            ) : (
              <div className="space-y-3">
                {stats.recentIssues.map((issue: any) => (
                  <Link
                    key={issue.id}
                    href={`/villa-issues/${issue.id}`}
                    className="block p-3 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{issue.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {issue.createdBy.name}
                          {issue.createdBy.wing && issue.createdBy.flatNo
                            ? ` · Wing ${issue.createdBy.wing}-${issue.createdBy.flatNo}`
                            : ""}
                          {" · "}
                          {format(new Date(issue.createdAt), "dd MMM yyyy")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <StatusBadge status={issue.status} />
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
