"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FinanceSummaryQuarterFilterProps {
  quarters: { id: string; name: string }[];
  quarterId?: string;
}

export function FinanceSummaryQuarterFilter({
  quarters,
  quarterId,
}: FinanceSummaryQuarterFilterProps) {
  const router = useRouter();
  const pathname = usePathname();

  function updateQuarter(value: string) {
    const query = value === "all" ? "" : `?quarterId=${encodeURIComponent(value)}`;
    router.push(`${pathname}${query}`);
  }

  return (
    <div className="w-full sm:w-56">
      <Select value={quarterId || "all"} onValueChange={updateQuarter}>
        <SelectTrigger aria-label="Filter by quarter">
          <SelectValue placeholder="All quarters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All quarters</SelectItem>
          {quarters.map((quarter) => (
            <SelectItem key={quarter.id} value={quarter.id}>
              {quarter.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}