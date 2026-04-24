"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { KanbanContactCard } from "./kanban-contact-card";
import type { ContactCardData } from "./contact-card";

interface KanbanColumnProps {
  category: { id: string; name: string; icon: string | null; color: string | null };
  contacts: ContactCardData[];
  currentUserId: string;
  isAdmin: boolean;
  isDndEnabled: boolean;
}

export function KanbanColumn({ category, contacts, currentUserId, isAdmin, isDndEnabled }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: category.id });
  const bg = category.color ?? "#64748b";

  return (
    <div className="flex w-64 shrink-0 flex-col rounded-xl border bg-gray-50">
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2.5"
        style={{ backgroundColor: bg + "22", borderBottom: `2px solid ${bg}` }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold"
            style={{ backgroundColor: bg + "33", color: bg }}>
            {contacts.length}
          </span>
          <span className="text-sm font-semibold" style={{ color: bg }}>{category.name}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-60 hover:opacity-100" asChild>
          <Link href={`/contacts/new?categoryId=${category.id}`}>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Cards */}
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-col gap-2 p-2 transition-colors ${isOver ? "bg-blue-50" : ""}`}
        style={{ minHeight: 120 }}
      >
        {isDndEnabled ? (
          <SortableContext items={contacts.map((c) => c.id)} strategy={verticalListSortingStrategy}>
            {contacts.map((contact) => (
              <KanbanContactCard key={contact.id} contact={contact} currentUserId={currentUserId} isAdmin={isAdmin} isDraggable />
            ))}
          </SortableContext>
        ) : (
          contacts.map((contact) => (
            <KanbanContactCard key={contact.id} contact={contact} currentUserId={currentUserId} isAdmin={isAdmin} isDraggable={false} />
          ))
        )}

        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-gray-400">No contacts yet</p>
            <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
              <Link href={`/contacts/new?categoryId=${category.id}`}>+ Add one</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
