"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { WINGS } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface IssueFiltersProps {
  categories: Category[];
}

export function IssueFilters({ categories }: IssueFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
          params.delete("page");
        }
      }
      return params.toString();
    },
    [searchParams]
  );

  const updateFilter = (key: string, value: string | null) => {
    router.push(`${pathname}?${createQueryString({ [key]: value })}`);
  };

  const clearAll = () => {
    router.push(pathname);
  };

  const hasFilters =
    searchParams.get("status") ||
    searchParams.get("categoryId") ||
    searchParams.get("priority") ||
    searchParams.get("wing") ||
    searchParams.get("search");

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search issues..."
          className="pl-9"
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            const timer = setTimeout(() => updateFilter("search", val || null), 400);
            return () => clearTimeout(timer);
          }}
        />
      </div>

      <Select
        value={searchParams.get("status") ?? ""}
        onValueChange={(v) => updateFilter("status", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
          <SelectItem value="COMPLETED">Completed</SelectItem>
          <SelectItem value="REJECTED">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("categoryId") ?? ""}
        onValueChange={(v) => updateFilter("categoryId", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("wing") ?? ""}
        onValueChange={(v) => updateFilter("wing", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-28">
          <SelectValue placeholder="Wing" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Wings</SelectItem>
          {WINGS.map((wing) => (
            <SelectItem key={wing} value={wing}>
              Wing {wing}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("priority") ?? ""}
        onValueChange={(v) => updateFilter("priority", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="URGENT">Urgent</SelectItem>
          <SelectItem value="HIGH">High</SelectItem>
          <SelectItem value="MEDIUM">Medium</SelectItem>
          <SelectItem value="LOW">Low</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
          <X className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
