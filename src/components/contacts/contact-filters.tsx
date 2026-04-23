"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, LayoutList, Columns3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string; color: string | null }

export function ContactFilters({
  categories,
  view = "list",
}: {
  categories: Category[];
  view?: "list" | "kanban";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") { params.set(key, value); } else { params.delete(key); }
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by name, phone…"
          defaultValue={searchParams.get("search") ?? ""}
          className="pl-9"
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) { params.set("search", e.target.value); } else { params.delete("search"); }
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      <Select defaultValue={searchParams.get("categoryId") ?? "all"} onValueChange={(v) => setParam("categoryId", v)}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={searchParams.get("type") ?? "all"} onValueChange={(v) => setParam("type", v)}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="INDIVIDUAL">Individual</SelectItem>
          <SelectItem value="COMPANY">Company</SelectItem>
        </SelectContent>
      </Select>

      {/* View toggle */}
      <div className="ml-auto flex items-center gap-1 rounded-md border p-1">
        <Button variant={view === "list" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" asChild>
          <Link href="/contacts"><LayoutList className="h-4 w-4" /></Link>
        </Button>
        <Button variant={view === "kanban" ? "secondary" : "ghost"} size="sm" className="h-7 px-2" asChild>
          <Link href="/contacts/kanban"><Columns3 className="h-4 w-4" /></Link>
        </Button>
      </div>
    </div>
  );
}
