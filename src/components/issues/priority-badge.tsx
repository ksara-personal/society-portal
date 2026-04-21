import { Badge } from "@/components/ui/badge";
import { Priority } from "@prisma/client";

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  MEDIUM: { label: "Medium", className: "bg-orange-100 text-orange-700 hover:bg-orange-100" },
  HIGH: { label: "High", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  URGENT: { label: "Urgent", className: "bg-red-200 text-red-900 hover:bg-red-200 font-semibold" },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
