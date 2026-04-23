"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Share2, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { ContactTypeBadge } from "./contact-type-badge";
import { ShareContactSheet } from "./share-contact-sheet";
import type { ContactCardData } from "./contact-card";

interface KanbanContactCardProps {
  contact: ContactCardData;
  currentUserId: string;
  isAdmin: boolean;
  isDraggable: boolean;
}

export function KanbanContactCard({ contact, isDraggable }: KanbanContactCardProps) {
  const [showShare, setShowShare] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: contact.id, disabled: !isDraggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className="group rounded-md border bg-white p-3 shadow-sm">
        <div className="flex items-start gap-1">
          {isDraggable && (
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab touch-none opacity-0 group-hover:opacity-40 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/contacts/${contact.id}`} className="truncate text-sm font-semibold text-gray-900 hover:underline">
              {contact.name}
            </Link>
            {contact.type === "INDIVIDUAL" && contact.companyName && (
              <p className="truncate text-[11px] text-gray-500">{contact.companyName}</p>
            )}
            <div className="mt-1">
              <ContactTypeBadge type={contact.type} />
            </div>
            {contact.phone && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500">
                <Phone className="h-3 w-3" />{contact.phone}
              </p>
            )}
            <div className="mt-2 flex justify-end">
              <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={() => setShowShare(true)}>
                <Share2 className="h-3 w-3" /> Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ShareContactSheet open={showShare} onOpenChange={setShowShare} contact={contact} />
    </>
  );
}
