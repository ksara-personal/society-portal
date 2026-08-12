"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWings, useFlatsForWing } from "@/hooks/use-wings";
import { SlidersHorizontal, X } from "lucide-react";

export function AllVillaFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [wing, setWing] = useState(searchParams.get("wing") ?? "");
  const [flatNo, setFlatNo] = useState(searchParams.get("flatNo") ?? "");
  const wings = useWings();
  const flats = useFlatsForWing(wing);

  function apply() {
    const params = new URLSearchParams();
    if (wing) params.set("wing", wing);
    if (flatNo) params.set("flatNo", flatNo);
    startTransition(() => {
      router.push(`/admin/all-villa-issues?${params.toString()}`);
    });
  }

  function reset() {
    setWing("");
    setFlatNo("");
    startTransition(() => router.push("/admin/all-villa-issues"));
  }

  const hasFilter = !!searchParams.get("wing") || !!searchParams.get("flatNo");

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <SlidersHorizontal className="h-4 w-4" />
        Filter
      </div>

      <div className="w-36">
        <Select value={wing} onValueChange={(v) => { setWing(v); setFlatNo(""); }}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All wings" />
          </SelectTrigger>
          <SelectContent>
            {wings.map((w) => (
              <SelectItem key={w} value={w}>
                Wing {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-36">
        <Select value={flatNo} onValueChange={setFlatNo}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All flats" />
          </SelectTrigger>
          <SelectContent>
            {flats.map((f) => (
              <SelectItem key={f} value={f}>
                Flat {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button size="sm" onClick={apply} disabled={isPending}>
        Apply
      </Button>

      {hasFilter && (
        <Button size="sm" variant="ghost" onClick={reset} disabled={isPending} className="gap-1 text-gray-500">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
