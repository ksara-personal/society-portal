"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
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
  AlertTriangle,
  ListChecks
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BRANDING, myUnitIssuesLabel, unitDashboardLabel, allUnitIssuesLabel, membersLabel } from "@/config/branding";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

function buildNavItems(): NavItem[] {
  return [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/issues", label: "All Issues", icon: ClipboardList },
    { href: "/issues/new", label: "Report Issue", icon: PlusCircle },
    { href: "/villa-issues", label: myUnitIssuesLabel(), icon: Home },
    { href: "/residents", label: membersLabel(), icon: Users },
    { href: "/profile", label: "My Profile", icon: UserCircle },
    { href: "/payments", label: "My Payments", icon: IndianRupee },
  ];
}

const serviceDirectoryItems: NavItem[] = [
  { href: "/contacts", label: "Service Contacts", icon: BookUser },
];

function buildAdminItems(): NavItem[] {
  return [
    { href: "/admin/villa-dashboard", label: unitDashboardLabel(), icon: BarChart2 },
    { href: "/admin/all-villa-issues", label: allUnitIssuesLabel(), icon: Building2 },
    { href: "/admin/users", label: "Users", icon: Users }
  ];
}

const adminMasterDataItems: NavItem[] = [
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/expense-categories", label: "Expense Categories", icon: Tag },
  { href: "/admin/expense-types", label: "Expense Types", icon: FolderOpen },
  { href: "/admin/payment-types", label: "Payment Types", icon: IndianRupee },
  { href: "/admin/contacts/categories", label: "Service Contact Categories", icon: BookUser },
  { label: "Quarters", href: "/admin/quarters", icon: CalendarRange },
];

const adminFinanceItems: NavItem[] = [
  { label: "Payments", href: "/admin/payments", icon: IndianRupee },
  { label: "Expense Items", href: "/admin/expense-items", icon: IndianRupee },
  { label: "Collection Summary", href: "/admin/finance-summary", icon: IndianRupee },
  { label: "Quarterly Balances", href: "/admin/quarterly-balances", icon: BarChart2 },
  { label: "Dues", href: "/admin/dues", icon: AlertTriangle },
  { label: "Dues Tracker", href: "/admin/dues-tracker", icon: ListChecks },
];

function renderSidebarLink(item: NavItem, isActive: boolean) {
  return (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";
  const navItems = buildNavItems();
  const adminItems = buildAdminItems();

  return (
    <aside className="flex flex-col h-full w-64 border-r bg-white">
      {/* Logo */}
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-3">
          {BRANDING.logoPath ? (
            <Image
              src={BRANDING.logoPath}
              alt={BRANDING.communityName}
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          )}
          <div>
            <p className="font-semibold text-sm leading-tight">{BRANDING.communityName}</p>
            <p className="text-xs text-gray-500 leading-tight">{BRANDING.communitySubtitle}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === "/issues"
              ? pathname === "/issues" ||
                (pathname.startsWith("/issues") &&
                  !pathname.startsWith("/issues/new"))
              : pathname === item.href || pathname.startsWith(item.href + "/");
          return renderSidebarLink(item, isActive);
        })}

        {/* Non-admin Quarterly Balances link */}
        {!isAdmin && (() => {
          const item: NavItem = { href: "/admin/quarterly-balances", label: "Quarterly Balances", icon: BarChart2 };
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return renderSidebarLink(item, isActive);
        })()}

        {/* Service Directory group */}
        <Separator className="my-2" />
        <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
          <FolderOpen className="h-3 w-3" />
          Service Directory
        </p>
        {serviceDirectoryItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return renderSidebarLink(item, isActive);
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
              return renderSidebarLink(item, isActive);
            })}
          </>
        )}

        {/* Admin Master Data group */}
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Master Data
            </p>
            {adminMasterDataItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return renderSidebarLink(item, isActive);
            })}
          </>
        )}

        {/* Admin Finance Mgmt group */}
        {isAdmin && (
          <>
            <Separator className="my-2" />
            <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Finance Management
            </p>
            {adminFinanceItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return renderSidebarLink(item, isActive);
            })}
          </>
        )}
      </nav>

      <div className="border-t p-3">
        <p className="text-xs uppercase tracking-wider text-gray-500">Signed in as</p>
        <p className="font-semibold">{userName}</p>
        <p className="text-xs text-gray-500 truncate">{userEmail}</p>
        <Button variant="secondary" className="mt-3 w-full" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
