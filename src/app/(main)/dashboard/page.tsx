import { getDashboardStats } from "@/actions/dashboard";
import { BRANDING, membersLabel } from "@/config/branding";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { RecentIssues } from "@/components/dashboard/recent-issues";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin
            ? `Here's an overview of all issues across ${BRANDING.communityName} ${membersLabel().toLowerCase()}.`
            : "Here's a summary of your reported issues."}
        </p>
      </div>

      <KpiCards
        total={stats.total}
        statusCounts={stats.statusCounts}
        avgResolutionDays={stats.avgResolutionDays}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart data={stats.statusCounts} />
        <CategoryChart data={stats.categoryData} />
      </div>

      {isAdmin && stats.wingData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.wingData.map((w) => (
            <div key={w.name} className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500">Wing {w.name}</p>
              <p className="text-2xl font-bold mt-1">{w.count}</p>
              <p className="text-xs text-gray-400">issues</p>
            </div>
          ))}
        </div>
      )}

      <TrendChart data={stats.trendData} />
      <RecentIssues issues={stats.recentIssues} />
    </div>
  );
}
