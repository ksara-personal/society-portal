"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type AccordionGroup<T> = {
  id: string;
  name: string;
  color?: string | null;
  label?: string;
  items: T[];
};

interface AccordionProps<T> {
  groups: AccordionGroup<T>[];
  renderItem: (item: T) => ReactNode;
  emptyStateText?: string;
}

export function Accordion<T>({
  groups,
  renderItem,
  emptyStateText = "No items found.",
}: AccordionProps<T>) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(groups.map((group) => group.id))
  );

  const visibleGroups = groups.filter((group) => group.items.length > 0);

  if (visibleGroups.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-lg">{emptyStateText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => {
        const isOpen = openIds.has(group.id);
        const count = group.items.length;

        return (
          <div
            key={group.id}
            className="rounded-lg border bg-white shadow-sm overflow-hidden"
          >
            <button
              type="button"
              onClick={() =>
                setOpenIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(group.id)) next.delete(group.id);
                  else next.add(group.id);
                  return next;
                })
              }
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              {group.color && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: group.color }}
                />
              )}

              <span className="font-semibold text-gray-900 flex-1 text-sm">
                {group.name}
              </span>

              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 shrink-0">
                {group.label ?? `${count} item${count !== 1 ? "s" : ""}`}
              </span>

              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="border-t px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.items.map((item) => renderItem(item))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
