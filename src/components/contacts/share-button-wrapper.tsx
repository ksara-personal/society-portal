"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareContactSheet } from "./share-contact-sheet";
import type { ShareContactSheetProps } from "./share-contact-sheet";

// Re-export the type so the detail page can use it
export type { ContactForShare } from "./share-contact-sheet";

interface ShareButtonWrapperProps {
  contact: Parameters<typeof ShareContactSheet>[0]["contact"];
}

export function ShareButtonWrapper({ contact }: ShareButtonWrapperProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Share2 className="mr-2 h-4 w-4" />
        Share contact
      </Button>
      <ShareContactSheet open={open} onOpenChange={setOpen} contact={contact} />
    </>
  );
}
