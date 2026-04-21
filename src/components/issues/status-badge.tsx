import { Badge } from "@/components/ui/badge";
import { IssueStatus } from "@prisma/client";

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  },
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
