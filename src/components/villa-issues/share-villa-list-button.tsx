"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRANDING } from "@/config/branding";

interface Issue {
  title: string;
  status: string;
  category: { name: string };
}

interface ShareVillaListButtonProps {
  issues: Issue[];
}

function formatStatus(s: string) {
  return s
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ShareVillaListButton({ issues }: ShareVillaListButtonProps) {
  const handleShare = async () => {
    if (issues.length === 0) return;

    const lines: string[] = [];
    lines.push(`🏠 *My ${BRANDING.unitLabel} Issues (${issues.length})*`);
    lines.push("");

    issues.forEach((issue, i) => {
      lines.push(`${i + 1}. ${issue.title}`);
      lines.push(`   📂 ${issue.category.name}  |  ${formatStatus(issue.status)}`);
    });

    const shareText = lines.join("\n");

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `My ${BRANDING.unitLabel} Issues`, text: shareText });
        return;
      } catch {
        // cancelled or unsupported — fall through
      }
    }

    // Desktop fallback: open WhatsApp Web
    const waText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${waText}`, "_blank");
  };

   return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      disabled={issues.length === 0}
      className="gap-1.5"
    >
      <Share2 className="h-4 w-4" />
      Share List
    </Button>
  );
}