"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useToast } from "@/components/ui/use-toast";
import { KanbanColumn } from "./kanban-column";
import { KanbanContactCard } from "./kanban-contact-card";
import { moveContactToCategory } from "@/actions/contacts";
import type { ContactCardData } from "./contact-card";

type KanbanCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  contacts: ContactCardData[];
};

interface ContactKanbanProps {
  initialCategories: KanbanCategory[];
  currentUserId: string;
  isAdmin: boolean;
}

export function ContactKanban({ initialCategories, currentUserId, isAdmin }: ContactKanbanProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [activeContact, setActiveContact] = useState<ContactCardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function findColumnOf(contactId: string) {
    return categories.find((cat) => cat.contacts.some((c) => c.id === contactId));
  }

  function handleDragStart({ active }: DragStartEvent) {
    const col = findColumnOf(String(active.id));
    setActiveContact(col?.contacts.find((c) => c.id === active.id) ?? null);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const fromColId = findColumnOf(String(active.id))?.id;
    const toColId =
      categories.find((c) => c.id === over.id)?.id ??
      findColumnOf(String(over.id))?.id;
    if (!fromColId || !toColId || fromColId === toColId) return;

    setCategories((prev) => {
      const fromCol = prev.find((c) => c.id === fromColId)!;
      const toCol   = prev.find((c) => c.id === toColId)!;
      const moving  = fromCol.contacts.find((c) => c.id === active.id)!;
      return prev.map((col) => {
        if (col.id === fromColId) return { ...col, contacts: col.contacts.filter((c) => c.id !== active.id) };
        if (col.id === toColId)   return { ...col, contacts: [...col.contacts, { ...moving, category: { id: toCol.id, name: toCol.name, icon: toCol.icon, color: toCol.color } }] };
        return col;
      });
    });
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveContact(null);
    if (!over) return;
    const toColId =
      categories.find((c) => c.id === over.id)?.id ??
      findColumnOf(String(over.id))?.id;
    if (!toColId) return;
    try {
      await moveContactToCategory(String(active.id), toColId);
    } catch {
      toast({ title: "Error", description: "Failed to move contact — please try again", variant: "destructive" });
      setCategories(initialCategories);
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {categories.map((cat) => (
          <KanbanColumn
            key={cat.id}
            category={cat}
            contacts={cat.contacts}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
            isDndEnabled={isAdmin}
          />
        ))}
      </div>

      <DragOverlay>
        {activeContact && (
          <div className="rotate-2 opacity-95">
            <KanbanContactCard contact={activeContact} currentUserId={currentUserId} isAdmin={isAdmin} isDraggable={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
