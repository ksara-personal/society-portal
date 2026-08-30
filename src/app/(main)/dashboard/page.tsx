import { getDashboardStats, getResidentDashboardSummary } from "@/actions/dashboard";
import { BRANDING, membersLabel } from "@/config/branding";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { RecentIssues } from "@/components/dashboard/recent-issues";
import { DuesSummaryCard } from "@/components/dashboard/dues-summary-card";
import { MyIssuesSummary } from "@/components/dashboard/my-issues-summary";
import { LatestMeetingCard } from "@/components/dashboard/latest-meeting-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { getCurrentUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  if (!isAdmin) {
    const summary = await getResidentDashboardSummary();

    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with your {BRANDING.unitLabel.toLowerCase()} and community.
          </p>
        </div>

        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DuesSummaryCard
            outstandingAmount={summary.dues.outstandingAmount}
            currentQuarterName={summary.dues.currentQuarterName}
            currentQuarterStatus={summary.dues.currentQuarterStatus}
          />
          <MyIssuesSummary
            societyOpenCount={summary.issues.societyOpenCount}
            villaOpenCount={summary.issues.villaOpenCount}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentActivity issues={summary.issues.recentIssues} />
          <LatestMeetingCard meeting={summary.latestMeeting} />
        </div>
      </div>
    );
  }

  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here&apos;s an overview of all issues across {BRANDING.communityName} {membersLabel().toLowerCase()}.
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

      {stats.wingData.length > 0 && (
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

