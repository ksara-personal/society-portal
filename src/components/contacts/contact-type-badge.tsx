import { Badge } from "@/components/ui/badge";
import { Building2, User } from "lucide-react";
import type { ContactType } from "@prisma/client";

export function ContactTypeBadge({ type }: { type: ContactType }) {
  if (type === "COMPANY") {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Building2 className="h-3 w-3" />
        Company
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <User className="h-3 w-3" />
      Individual
    </Badge>
  );
}
