import { Suspense } from "react";
import Link from "next/link";
import { getIssuesGrouped, getCategories } from "@/actions/issues";
import { IssueAccordion, type IssueItem } from "@/components/issues/issue-accordion";
import { type AccordionGroup } from "@/components/ui/accordion";
import { IssueFilters } from "@/components/issues/issue-filters";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList } from "lucide-react";

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function IssuesPage({ searchParams }: PageProps) {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "string") params[key] = value;
  }

  const [{ grouped, total }, categories] = await Promise.all([
    getIssuesGrouped(params),
    getCategories(),
  ]);

  // Map grouped data to AccordionGroup format
  const issueGroups: AccordionGroup<IssueItem>[] = grouped.map(({ category, issues }) => ({
    id: category.id,
    name: category.name,
    label: `${issues.length} issue${issues.length !== 1 ? "s" : ""}`,
    items: issues,
  }));

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Issues</h1>
          <p className="text-sm text-gray-500">
            {total} issue{total !== 1 ? "s" : ""} found
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

      {grouped.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-gray-400">
          <ClipboardList className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">No issues found</p>
          <p className="text-sm mt-1">
            Try adjusting your filters or{" "}
            <Link href="/issues/new" className="text-primary hover:underline">
              report a new issue
            </Link>
            .
          </p>
        </div>
      ) : (
        <IssueAccordion groups={issueGroups} />
      )}
    </div>
  );
}
