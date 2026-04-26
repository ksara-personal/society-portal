import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { MapPin, User, ImageIcon, UserCheck } from "lucide-react";

interface IssueCardProps {
  issue: {
    id: string;
    title: string;
    status: any;
    priority: any;
    wing: string | null;
    location: string | null;
    createdAt: Date;
    category: { name: string; icon: string | null };
    createdBy: { name: string; wing: string | null; flatNo: string | null };
    assignedTo?: { name: string } | null;
    attachments: { url: string }[];
  };
  href?: string;
}

export function IssueCard({ issue, href }: IssueCardProps) {
  return (
    <Link href={href ?? `/issues/${issue.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm line-clamp-2">{issue.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {issue.category.name} &middot;{" "}
                {formatDistanceToNow(new Date(issue.createdAt), {
                  addSuffix: true,
                })}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {issue.createdBy.name}
                  {issue.createdBy.flatNo &&
                    ` (${issue.createdBy.wing}-${issue.createdBy.flatNo})`}
                </span>
                {issue.wing && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Wing {issue.wing}
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
                  <UserCheck className="h-3 w-3" />
                  {issue.assignedTo?.name ?? "Unassigned"}
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
  );
}
