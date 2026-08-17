"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Trash2, Eye, EyeOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HtmlContent } from "./html-content";
import { ShareMeetingButton } from "./share-meeting-button";
import { useToast } from "@/components/ui/use-toast";
import { setMeetingStatus, deleteMeeting } from "@/actions/meetings";
import { cn } from "@/lib/utils";

export type MeetingListItem = {
  id: string;
  title: string;
  content: string;
  meetingDate: Date;
  status: "DRAFT" | "PUBLISHED";
  createdBy: { name: string };
};

interface MeetingCardProps {
  meeting: MeetingListItem;
  isAdmin: boolean;
  defaultOpen?: boolean;
  highlightLabel?: string;
}

export function MeetingCard({ meeting, isAdmin, defaultOpen = false, highlightLabel }: MeetingCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(defaultOpen);
  const [isPending, startTransition] = useTransition();

  const dateLabel = meeting.meetingDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeLabel = meeting.meetingDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleTogglePublish() {
    const nextStatus = meeting.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    startTransition(async () => {
      const result = await setMeetingStatus(meeting.id, nextStatus);
      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: nextStatus === "PUBLISHED" ? "Published" : "Unpublished" });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete these meeting minutes? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteMeeting(meeting.id);
      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Meeting minutes deleted" });
      router.refresh();
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">{meeting.title}</span>
            {highlightLabel && <Badge>{highlightLabel}</Badge>}
            {isAdmin && (
              <Badge variant={meeting.status === "PUBLISHED" ? "secondary" : "outline"}>
                {meeting.status === "PUBLISHED" ? "Published" : "Draft"}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            {dateLabel} at {timeLabel}
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <HtmlContent html={meeting.content} className="space-y-2 text-sm text-gray-700" />

          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <ShareMeetingButton meeting={meeting} />
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/meetings/${meeting.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
                <Button variant="outline" size="sm" disabled={isPending} onClick={handleTogglePublish}>
                  {meeting.status === "PUBLISHED" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {meeting.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
