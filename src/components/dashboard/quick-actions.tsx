import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wallet, BookText, Users } from "lucide-react";
import { BRANDING } from "@/config/branding";

export function QuickActions() {
  const actions = [
    { label: "Report an Issue", href: "/issues/new", icon: PlusCircle },
    { label: `Report ${BRANDING.unitLabel} Issue`, href: "/villa-issues/new", icon: PlusCircle },
    { label: "My Payments", href: "/payments", icon: Wallet },
    { label: "Meeting Minutes", href: "/meetings", icon: BookText },
    { label: "Contacts", href: "/contacts", icon: Users },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button key={action.href} variant="outline" size="sm" asChild>
          <Link href={action.href} className="gap-1.5">
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
