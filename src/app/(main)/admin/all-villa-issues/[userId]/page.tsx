import Link from "next/link";
import { notFound } from "next/navigation";
import { getVillaIssuesByUserId } from "@/actions/villa-issues";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Home,
  MapPin,
  ImageIcon,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BRANDING, myUnitIssuesLabel, allUnitIssuesLabel } from "@/config/branding";

interface PageProps {
  params: { userId: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: AlertCircle,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  REJECTED: XCircle,
};

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

      {/* Issue list */}
      {issues.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400">No issues match the selected filter.</p>
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
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50"
                        >
                          {BRANDING.unitLabel}
                        </Badge>
                      </div>
                      <h3 className="font-medium text-sm line-clamp-2">{issue.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {issue.category.name} ·{" "}
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
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
                            {issue.attachments.length} photo
                            {issue.attachments.length > 1 ? "s" : ""}
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
        