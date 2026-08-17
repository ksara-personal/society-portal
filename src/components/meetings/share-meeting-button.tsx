"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareMeetingButtonProps {
  meeting: {
    title: string;
    content: string;
    meetingDate: Date;
  };
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/(p|div|h[1-4]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function ShareMeetingButton({ meeting }: ShareMeetingButtonProps) {
  const handleShare = async () => {
    const dateLabel = meeting.meetingDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const lines: string[] = [
      `📋 *${meeting.title}*`,
      `📅 ${dateLabel}`,
      "",
      htmlToPlainText(meeting.content),
    ];

    const shareText = lines.join("\n");
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";

    // Try native Web Share API first (opens WhatsApp, Messages, etc. on mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: meeting.title, text: shareText, url: pageUrl });
        return;
      } catch {
        // Cancelled or not supported — fall through
      }
    }

    // Desktop fallback: open WhatsApp Web
    const waText = encodeURIComponent(shareText + (pageUrl ? `\n\n${pageUrl}` : ""));
    window.open(`https://wa.me/?text=${waText}`, "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
