"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareIssueProps {
  issue: {
    title: string;
    description: string;
    status: string;
    priority: string;
    category: { name: string };
    createdBy: { name: string; wing?: string; flatNo?: string };
    assignedTo?: { name: string } | null;
    wing?: string;
    location?: string;
    attachments?: { url: string; type: string; filename: string }[];
  };
}

function formatStatus(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ShareIssueButton({ issue }: ShareIssueProps) {
  const handleShare = async () => {
    const imageUrls =
      issue.attachments
        ?.filter((a) => a.type === "IMAGE")
        .map((a) => a.url) ?? [];

    const lines: string[] = [];
    lines.push(`📋 *${issue.title}*`);
    lines.push(`🏷️ Category: ${issue.category.name}`);
    lines.push(`📌 Status: ${formatStatus(issue.status)}  |  Priority: ${formatStatus(issue.priority)}`);

    if (issue.wing || issue.location) {
      const loc = [issue.wing ? `Wing ${issue.wing}` : "", issue.location ?? ""]
        .filter(Boolean)
        .join(" — ");
      lines.push(`📍 Location: ${loc}`);
    }

    lines.push(`👤 Reported by: ${issue.createdBy.name}${issue.createdBy.wing && issue.createdBy.flatNo ? ` (Wing ${issue.createdBy.wing}-${issue.createdBy.flatNo})` : ""}`);

    if (issue.assignedTo) {
      lines.push(`🔧 Assigned to: ${issue.assignedTo.name}`);
    }

    lines.push("");
    lines.push(`📝 ${issue.description}`);

    if (imageUrls.length > 0) {
      lines.push("");
      lines.push(`🖼️ Photos (${imageUrls.length}):`);
      imageUrls.forEach((url, i) => lines.push(`  ${i + 1}. ${url}`));
    }

    const shareText = lines.join("\n");
    const pageUrl = typeof window !== "undefined" ? window.location.href : "";

    // Try native Web Share API first (opens WhatsApp, Messages, etc. on mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: issue.title,
          text: shareText,
          url: pageUrl,
        });
        return;
      } catch {
        // Cancelled or not supported — fall through
      }
    }

    // Desktop fallback: open WhatsApp Web
    const waText = encodeURIComponent(shareText + "\n\n" + pageUrl);
    window.open(`https://wa.me/?text=${waText}`, "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare} className="gap-1">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  );
}
