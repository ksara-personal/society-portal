"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Phone, Mail, MapPin, Building2, MoreVertical, Pencil, Trash2, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContactTypeBadge } from "./contact-type-badge";
import { ShareContactSheet } from "./share-contact-sheet";
import { deleteContact } from "@/actions/contacts";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export type ContactCardData = {
  id: string;
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
  phone: string | null;
  altPhone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  createdAt: Date;
  category: { id: string; name: string; icon: string | null; color: string | null };
  createdBy: { id: string; name: string };
};

interface ContactCardProps {
  contact: ContactCardData;
  currentUserId: string;
  isAdmin: boolean;
  compact?: boolean;
}

export function ContactCard({ contact, currentUserId, isAdmin, compact = false }: ContactCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canEdit = isAdmin || contact.createdBy.id === currentUserId;

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteContact(contact.id);
        toast({ title: "Contact deleted" });
        router.refresh();
      } catch (err: any) {
        toast({ title: "Error", description: err.message ?? "Failed to delete", variant: "destructive" });
      } finally {
        setShowDeleteDialog(false);
      }
    });
  }

  return (
    <>
      <div className="group relative rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
        {contact.category.color && (
          <div
            className="absolute left-0 top-0 h-full w-1 rounded-l-lg"
            style={{ backgroundColor: contact.category.color }}
          />
        )}

        <div className="pl-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Link
                href={`/contacts/${contact.id}`}
                className="truncate text-sm font-semibold text-gray-900 hover:underline"
              >
                {contact.name}
              </Link>
              {contact.type === "INDIVIDUAL" && contact.companyName && (
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                  <Building2 className="h-3 w-3 shrink-0" />
                  {contact.companyName}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowShareSheet(true)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </DropdownMenuItem>
                {canEdit && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/contacts/${contact.id}/edit`}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <ContactTypeBadge type={contact.type} />
            <Badge
              variant="outline"
              className="text-xs"
              style={
                contact.category.color
                  ? { borderColor: contact.category.color + "80", color: contact.category.color, backgroundColor: contact.category.color + "15" }
                  : undefined
              }
            >
              {contact.category.name}
            </Badge>
          </div>

          {/* Details */}
          {!compact && (
            <div className="mt-3 space-y-1">
              {contact.phone && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3 w-3 shrink-0" />
                  <a href={`tel:${contact.phone}`} className="hover:text-gray-900 hover:underline">{contact.phone}</a>
                  {contact.altPhone && (
                    <><span className="text-gray-300">|</span>
                    <a href={`tel:${contact.altPhone}`} className="hover:text-gray-900 hover:underline">{contact.altPhone}</a></>
                  )}
                </p>
              )}
              {contact.email && (
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail className="h-3 w-3 shrink-0" />
                  <a href={`mailto:${contact.email}`} className="truncate hover:text-gray-900 hover:underline">{contact.email}</a>
                </p>
              )}
              {contact.address && (
                <p className="flex items-start gap-1.5 text-xs text-gray-500">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-2">{contact.address}</span>
                </p>
              )}
            </div>
          )}

          {compact && contact.phone && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <Phone className="h-3 w-3 shrink-0" />{contact.phone}
            </p>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between border-t pt-2">
            <p className="text-[11px] text-gray-400">Added by {contact.createdBy.name}</p>
            <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[11px]" onClick={() => setShowShareSheet(true)}>
              <Share2 className="h-3 w-3" /> Share
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{contact.name}</strong> will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ShareContactSheet open={showShareSheet} onOpenChange={setShowShareSheet} contact={contact} />
    </>
  );
}
