import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BRANDING, myUnitIssuesLabel, unitDashboardLabel, allUnitIssuesLabel, membersLabel } from "@/config/branding";

function getTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/issues/new") return "Report New Issue";
  if (pathname.match(/\/issues\/[^/]+\/edit/)) return "Edit Issue";
  if (pathname.match(/\/issues\/[^/]+/)) return "Issue Details";
  if (pathname === "/issues") return "All Issues";
  if (pathname === "/villa-issues/new") return `Log ${BRANDING.unitLabel} Issue`;
  if (pathname.match(/\/villa-issues\/[^/]+\/edit/)) return `Edit ${BRANDING.unitLabel} Issue`;
  if (pathname.match(/\/villa-issues\/[^/]+/)) return `${BRANDING.unitLabel} Issue Details`;
  if (pathname === "/villa-issues") return myUnitIssuesLabel();
  if (pathname === "/admin/villa-dashboard") return `${unitDashboardLabel()} Dashboard`;
  if (pathname === "/admin/all-villa-issues") return allUnitIssuesLabel();
  if (pathname.match(/\/admin\/all-villa-issues\/.+/)) return `${BRANDING.unitLabel} Issue Detail`;
  if (pathname === "/admin/categories") return "Manage Categories";
  if (pathname === "/admin/expense-categories") return "Expense Categories";
  if (pathname === "/admin/expense-types") return "Expense Types";
  if (pathname === "/admin/expense-items") return "Expense Items";
  if (pathname === "/admin/users") return "Manage Users";
  if (pathname === "/admin/residents") return `${membersLabel()} Directory`;
  if (pathname === "/profile") return "My Profile";
  return BRANDING.communityName;
}

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar — desktop only */}
      <div className="hidden lg:flex">
        <Sidebar
          userRole={session.user.role}
          userName={session.user.name ?? "User"}
          userEmail={session.user.email ?? ""}
        />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={BRANDING.communityName}
          userRole={session.user.role}
          userName={session.user.name ?? "User"}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
