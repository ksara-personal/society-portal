import { Suspense } from "react";
import Link from "next/link";
import { getIssues, getCategories } from "@/actions/issues";
import { IssueCard } from "@/components/issues/issue-card";
import { IssueFilters } from "@/components/issues/issue-filters";
import { Pagination } from "@/components/issues/pagination";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function IssuesPage({ searchParams }: PageProps) {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params[key] = value;
  }

  const [{ issues, pagination }, categories] = await Promise.all([
    getIssues(params),
    getCategories(),
  ]);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500">
            {pagination.total} issue{pagination.total !== 1 ? "s" : ""} found
          </p>
        </div>
        <Button asChild>
          <Link href="/issues/new" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Report Issue
          </Link>
        </Button>
      </div>

      <Suspense>
        <IssueFilters categories={categories} />
      </Suspense>

      {issues.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No issues found.</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your filters or{" "}
            <Link href="/issues/new" className="text-primary hover:underline">
              report a new issue
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue as any} />
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
