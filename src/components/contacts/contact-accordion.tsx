"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContactCard } from "./contact-card";
import type { ContactCardData } from "./contact-card";

type AccordionCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  contacts: ContactCardData[];
};

interface ContactAccordionProps {
  categories: AccordionCategory[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ContactAccordion({
  categories,
  currentUserId,
  isAdmin,
}: ContactAccordionProps) {
  // All sections open by default
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(categories.map((c) => c.id))
  );

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (categories.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-gray-400 text-lg">No contacts found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {categories.map((cat) => {
        const isOpen = openIds.has(cat.id);
        const count = cat.contacts.length;

        return (
          <div
            key={cat.id}
            className="rounded-lg border bg-white shadow-sm overflow-hidden"
          >
            {/* Accordion header */}
            <button
              onClick={() => toggle(cat.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              {/* Category colour dot */}
              {cat.color && (
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
              )}

              {/* Emoji icon */}
              {cat.icon && (
                <span className="text-lg leading-none shrink-0">{cat.icon}</span>
              )}

              {/* Name */}
              <span className="font-semibold text-gray-900 flex-1 text-sm">
                {cat.name}
              </span>

              {/* Count badge */}
              <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2.5 py-0.5 shrink-0">
                {count} contact{count !== 1 ? "s" : ""}
              </span>

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {/* Accordion body */}
            {isOpen && (
              <div className="border-t px-4 py-4">
                {count === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">
                    No contacts in this category.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cat.contacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        currentUserId={currentUserId}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
