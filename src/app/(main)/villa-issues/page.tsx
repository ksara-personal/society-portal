import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getVillaIssues } from "@/actions/villa-issues";
import { Pagination } from "@/components/issues/pagination";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Home, MapPin, ImageIcon, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ShareVillaListButton } from "@/components/villa-issues/share-villa-list-button";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VillaIssuesPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params[key] = value;
  }

  const { issues, pagination } = await getVillaIssues(session.user.id, params);
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            My Villa Issues
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pagination.total} issue{pagination.total !== 1 ? "s" : ""} in your villa
          </p>
        </div>
        <div className="flex gap-2">
          <ShareVillaListButton issues={issues} />
          <Button asChild>
            <Link href="/villa-issues/new" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Log Villa Issue
            </Link>
          </Button>
        </div>
      </div>

      {/* Status filter tabs */}
      <Suspense>
        <VillaStatusFilter current={params.status} />
      </Suspense>

      {/* Issues grid */}
      {issues.length === 0 ? (
        <div className="text-center py-16">
          <Home className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No villa issues found.</p>
          {!isAdmin && (
            <p className="text-gray-400 text-sm mt-1">
              <Link href="/villa-issues/new" className="text-primary hover:underline">
                Log your first villa issue
              </Link>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {issues.map((issue) => (
            <Link key={issue.id} href={`/villa-issues/${issue.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">
                          Villa
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2">{issue.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {issue.category.name} ·{" "}
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                        {isAdmin && (
                          <span className="flex items-center gap-1 font-medium text-gray-700">
                            {issue.createdBy.name}
                            {issue.createdBy.wing && issue.createdBy.flatNo
                              ? ` (${issue.createdBy.wing}-${issue.createdBy.flatNo})`
                              : ""}
                          </span>
                        )}
                        {(issue.wing || issue.flatNo) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {issue.wing ? `Wing ${issue.wing}` : ""}
                            {issue.flatNo ? ` Flat ${issue.flatNo}` : ""}
                          </span>
                        )}
                        {issue.attachments.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            {issue.attachments.length} photo{issue.attachments.length > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Suspense>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      </Suspense>
    </div>
  );
}

function VillaStatusFilter({ current }: { current?: string }) {
  const statuses = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Resolved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((s) => (
        <Link
          key={s.value}
          href={s.value ? `/villa-issues?status=${s.value}` : "/villa-issues"}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            current === s.value || (!current && !s.value)
              ? "bg-primary text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-primary/50"
          }`}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );
}
