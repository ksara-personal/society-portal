import Link from "next/link";
import { MobileNav } from "./mobile-nav";
import { SignOutButton } from "./sign-out-button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  title: string;
  userRole: string;
  userName: string;
}

export function Header({ title, userRole, userName }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center gap-3 px-4 shrink-0">
      <div className="lg:hidden">
        <MobileNav userRole={userRole} userName={userName} />
      </div>
      <h1 className="font-semibold text-gray-900 flex-1">{title}</h1>
      <div className="flex items-center gap-2">
        {userRole === "ADMIN" && (
          <Badge variant="outline" className="text-xs hidden sm:flex border-primary/30 text-primary">
            Admin
          </Badge>
        )}
        <Link
          href="/issues/new"
          className="hidden sm:flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90 transition-colors"
        >
          + Report Issue
        </Link>
        <SignOutButton />
      </div>
    </header>
  );
}
