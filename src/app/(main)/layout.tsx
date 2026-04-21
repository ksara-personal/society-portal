import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// Map pathnames to page titles
function getTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/issues/new") return "Report New Issue";
  if (pathname.match(/\/issues\/[^/]+\/edit/)) return "Edit Issue";
  if (pathname.match(/\/issues\/[^/]+/)) return "Issue Details";
  if (pathname === "/issues") return "All Issues";
  if (pathname === "/admin/categories") return "Manage Categories";
  if (pathname === "/admin/users") return "Manage Users";
  if (pathname === "/profile") return "My Profile";
  return "Amber Meadows";
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
          title="Amber Meadows"
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
