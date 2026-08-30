import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/issues/status-badge";

interface RecentActivityProps {
  issues: Array<{
    id: string;
    title: string;
    status: any;
    issueType: string;
    createdAt: Date;
    category: { name: string };
  }>;
}

export function RecentActivity({ issues }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={issue.issueType === "VILLA" ? `/villa-issues/${issue.id}` : `/issues/${issue.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{issue.title}</p>
                <p className="text-xs text-gray-500">
                  {issue.category.name} &middot;{" "}
                  {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                </p>
              </div>
              <StatusBadge status={issue.status} />
            </Link>
          ))}
          {issues.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No activity yet.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
