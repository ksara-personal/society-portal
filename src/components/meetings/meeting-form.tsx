"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "./rich-text-editor";
import { useToast } from "@/components/ui/use-toast";
import { createMeeting, updateMeeting } from "@/actions/meetings";

interface MeetingFormProps {
  meeting?: {
    id: string;
    title: string;
    content: string;
    meetingDate: Date;
  };
}

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isContentEmpty(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function MeetingForm({ meeting }: MeetingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(meeting?.title ?? "");
  const [meetingDate, setMeetingDate] = useState(meeting ? toDatetimeLocal(meeting.meetingDate) : "");
  const [content, setContent] = useState(meeting?.content ?? "");
  const isEdit = Boolean(meeting?.id);

  function submit(status: "DRAFT" | "PUBLISHED") {
    if (!title.trim() || !meetingDate || isContentEmpty(content)) {
      toast({
        title: "Missing fields",
        description: "Title, meeting date/time and content are all required.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.set("title", title);
    formData.set("meetingDate", meetingDate);
    formData.set("content", content);
    formData.set("status", status);

    startTransition(async () => {
      const result = isEdit && meeting
        ? await updateMeeting(meeting.id, formData)
        : await createMeeting(formData);

      if ("error" in result) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      toast({ title: status === "PUBLISHED" ? "Meeting minutes published" : "Draft saved" });
      router.push("/meetings");
      router.refresh();
    });
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. General Body Meeting - Q1 2026"
        />
      </div>

      <div>
        <Label htmlFor="meetingDate">Date &amp; time of meeting</Label>
        <Input
          id="meetingDate"
          type="datetime-local"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
        />
      </div>

      <div>
        <Label>Content</Label>
        <RichTextEditor value={content} onChange={setContent} placeholder="Write the meeting minutes..." />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => submit("DRAFT")}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save as Draft
        </Button>
        <Button type="button" disabled={isPending} onClick={() => submit("PUBLISHED")}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish
        </Button>
        <Button type="button" variant="ghost" disabled={isPending} onClick={() => router.push("/meetings")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
