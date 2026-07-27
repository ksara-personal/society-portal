"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Tag,
  Users,
  LogOut,
  Shield,
  UserCircle,
  Home,
  BarChart2,
  Building2,
  BookUser,
  FolderOpen,
  IndianRupee,
  CalendarRange,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { BRANDING, myUnitIssuesLabel, unitDashboardLabel, allUnitIssuesLabel, membersLabel } from "@/config/branding";

interface MobileNavProps {
  userRole: string;
  userName: string;
}

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard };

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issues", label: "All Issues", icon: ClipboardList },
  { href: "/issues/new", label: "Report Issue", icon: PlusCircle },
  { href: "/villa-issues", label: myUnitIssuesLabel(), icon: Home },
  { href: "/residents", label: membersLabel(), icon: Users },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/payments", label: "My Payments", icon: IndianRupee },
];

const serviceDirectoryItems: NavItem[] = [
  { href: "/contacts", label: "Service Contacts", icon: BookUser },
];

const adminItems: NavItem[] = [
  { href: "/admin/villa-dashboard", label: unitDashboardLabel(), icon: BarChart2 },
  { href: "/admin/all-villa-issues", label: allUnitIssuesLabel(), icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/contacts/categories", label: "Service Contact Categories", icon: BookUser },
  { label: "Payments", href: "/admin/payments", icon: IndianRupee },
  { label: "Quarters", href: "/admin/quarters", icon: CalendarRange },
  { label: "Dues", href: "/admin/dues", icon: AlertTriangle },

];

export function MobileNav({ userRole, userName }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="p-4 border-b shrink-0">
            <SheetTitle asChild>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
                {BRANDING.logoPath ? (
                  <Image
                    src={BRANDING.logoPath}
                    alt={BRANDING.communityName}
                    width={140}
                    height={44}
                    className="h-9 w-auto object-contain"
                    priority
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                )}
                <span className="font-semibold text-sm text-gray-900">{BRANDING.communityName}</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Service Directory group */}
            <Separator className="my-2" />
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <FolderOpen className="h-3 w-3" />
              Service Directory
            </p>
            {serviceDirectoryItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Admin group */}
            {isAdmin && (
              <>
                <Separator className="my-2" />
                <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </p>
                {adminItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </>
            )}
          </nav>

          <div className="border-t p-3 shrink-0">
            <p className="text-xs uppercase tracking-wider text-gray-500">Signed in as</p>
            <p className="font-semibold">{userName}</p>
            <Button variant="ghost" className="mt-3 w-full" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
