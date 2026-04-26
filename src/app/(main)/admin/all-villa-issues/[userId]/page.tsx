import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillaIssuesByUserId } from "@/actions/villa-issues";
import { IssueAccordion, type IssueItem } from "@/components/issues/issue-accordion";
import { type AccordionGroup } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Home,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { BRANDING, allUnitIssuesLabel } from "@/config/branding";

interface PageProps {
  params: { userId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function VillaDrilldownPage({ params, searchParams }: PageProps) {
  const spParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") spParams[k] = v;
  }

  const { issues, resident } = await getVillaIssuesByUserId(params.userId, spParams);
  if (!resident) notFound();

  const villaLabel =
    resident.wing && resident.flatNo
      ? `Wing ${resident.wing} — Flat ${resident.flatNo}`
      : resident.wing
      ? `Wing ${resident.wing}`
      : resident.flatNo
      ? `Flat ${resident.flatNo}`
      : BRANDING.unitLabel;

  // Summary counts
  const counts = issues.reduce(
    (acc, i) => ({ ...acc, [i.status]: (acc[i.status as keyof typeof acc] ?? 0) + 1 }),
    { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, REJECTED: 0 }
  );

  const statuses = [
    { value: "", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Resolved" },
    { value: "REJECTED", label: "Rejected" },
  ];
  const currentStatus = spParams.status ?? "";

  // Group issues by category for the accordion
  const groupMap = new Map<string, AccordionGroup<IssueItem>>();
  for (const issue of issues) {
    const key = issue.category.id;
    if (!groupMap.has(key)) {
      groupMap.set(key, { id: key, name: issue.category.name, items: [] });
    }
    groupMap.get(key)!.items.push(issue);
  }
  const issueGroups = Array.from(groupMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Back + header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link href="/admin/all-villa-issues" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            {allUnitIssuesLabel()}
          </Link>
        </Button>

        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{villaLabel}</h1>
            <p className="text-sm text-gray-500">{resident.name}</p>
          </div>
        </div>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-3">
        {([
          { label: "Total", value: issues.length, color: "bg-gray-100 text-gray-700" },
          { label: "Pending", value: counts.PENDING, color: "bg-yellow-50 text-yellow-700" },
          { label: "In Progress", value: counts.IN_PROGRESS, color: "bg-blue-50 text-blue-700" },
          { label: "Resolved", value: counts.COMPLETED, color: "bg-green-50 text-green-700" },
          { label: "Rejected", value: counts.REJECTED, color: "bg-red-50 text-red-700" },
        ] as const).map((s) => (
          <div key={s.label} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${s.color}`}>
            {s.label}: <span className="font-bold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Link
            key={s.value}
            href={
              s.value
                ? `/admin/all-villa-issues/${params.userId}?status=${s.value}`
                : `/admin/all-villa-issues/${params.userId}`
            }
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              currentStatus === s.value
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary/50"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Issues grouped by category */}
      <IssueAccordion
        groups={issueGroups}
        issueLinkPrefix="/villa-issues"
        emptyStateText="No issues match the selected filter."
      />
    </div>
  );
}
