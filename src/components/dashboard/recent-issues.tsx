import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/issues/status-badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface RecentIssuesProps {
  issues: Array<{
    id: string;
    title: string;
    status: any;
    createdAt: Date;
    category: { name: string };
    createdBy: { name: string };
  }>;
}

export function RecentIssues({ issues }: RecentIssuesProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Recent Issues</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/issues" className="gap-1 text-xs">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{issue.title}</p>
                <p className="text-xs text-gray-500">
                  {issue.category.name} &middot; {issue.createdBy.name}{" "}
                  &middot;{" "}
                  {formatDistanceToNow(new Date(issue.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <StatusBadge status={issue.status} />
            </Link>
          ))}
          {issues.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">
              No issues reported yet.{" "}
              <Link href="/issues/new" className="text-primary hover:underline">
                Report the first one
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
