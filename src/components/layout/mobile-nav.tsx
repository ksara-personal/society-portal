"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, LayoutDashboard, ClipboardList, PlusCircle, Tag, Users, LogOut, Shield, UserCircle, Home, BarChart2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface MobileNavProps {
  userRole: string;
  userName: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/issues", label: "All Issues", icon: ClipboardList },
  { href: "/issues/new", label: "Report Issue", icon: PlusCircle },
  { href: "/villa-issues", label: "My Villa Issues", icon: Home },
  { href: "/profile", label: "My Profile", icon: UserCircle },
];

const adminItems = [
  { href: "/admin/villa-dashboard", label: "Villa Dashboard", icon: BarChart2 },
  { href: "/admin/all-villa-issues", label: "All Villa Issues", icon: Building2 },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
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
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle asChild>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <Image
                  src="/amber-meadows.png"
                  alt="Amber Meadows"
                  width={140}
                  height={44}
                  className="h-9 w-auto object-contain"
                  priority
                />
                <span className="font-semibold text-sm text-gray-900">Amber Meadows</span>
              </Link>
            </SheetTitle>
          </SheetHeader>

          <nav className="p-3 space-y-1">
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

            {isAdmin && (
              <>
                <Separator className="my-2" />
                <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Admin
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

          <div className="absolute bottom-4 left-4 right-4">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50"
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/login" }); }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
