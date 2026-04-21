import { format } from "date-fns";
import { CheckCircle2, Clock, XCircle, AlertCircle, PlusCircle } from "lucide-react";

interface HistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  createdAt: Date;
  changedBy: { name: string; role: string };
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  PENDING: AlertCircle,
  IN_PROGRESS: Clock,
  COMPLETED: CheckCircle2,
  REJECTED: XCircle,
};

const statusColors: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50 border-yellow-200",
  IN_PROGRESS: "text-blue-600 bg-blue-50 border-blue-200",
  COMPLETED: "text-green-600 bg-green-50 border-green-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
};

export function StatusTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="space-y-0">
      {history.map((entry, index) => {
        const Icon = entry.fromStatus === null ? PlusCircle : (statusIcons[entry.toStatus] || Clock);
        const colorClass = statusColors[entry.toStatus] || "text-gray-600 bg-gray-50 border-gray-200";

        return (
          <div key={entry.id} className="flex gap-4">
            {/* Timeline line */}
            <div className="flex flex-col items-center">
              <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 ${colorClass}`}>
                <Icon className="h-4 w-4" />
              </div>
              {index < history.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 my-1" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    {entry.fromStatus === null
                      ? "Issue Reported"
                      : `Status → ${statusLabels[entry.toStatus]}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    by {entry.changedBy.name} &middot;{" "}
                    {format(new Date(entry.createdAt), "dd MMM yyyy, h:mm a")}
                  </p>
                </div>
              </div>
              {entry.note && (
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded px-3 py-1.5 border-l-2 border-gray-300">
                  {entry.note}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
