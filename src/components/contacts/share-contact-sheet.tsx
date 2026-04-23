"use client";

import { useState } from "react";
import { Copy, MessageCircle, Download, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

interface ContactForShare {
  name: string;
  type: "INDIVIDUAL" | "COMPANY";
  companyName: string | null;
  phone: string | null;
  altPhone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  category: { name: string };
}

interface ShareContactSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactForShare;
}

function buildPlainText(c: ContactForShare): string {
  const lines: string[] = [];
  lines.push(`📋 ${c.name} (${c.category.name})`);
  if (c.type === "INDIVIDUAL" && c.companyName) lines.push(`🏢 ${c.companyName}`);
  if (c.phone)   lines.push(`📞 ${c.phone}`);
  if (c.altPhone) lines.push(`📞 Alt: ${c.altPhone}`);
  if (c.email)   lines.push(`✉️  ${c.email}`);
  if (c.address) lines.push(`📍 ${c.address}`);
  if (c.website) lines.push(`🌐 ${c.website}`);
  if (c.notes)   lines.push(`💬 ${c.notes}`);
  return lines.join("\n");
}

function buildVCard(c: ContactForShare): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${c.name}`];
  if (c.type === "INDIVIDUAL") {
    const parts = c.name.split(" ");
    const last = parts.pop() ?? "";
    lines.push(`N:${last};${parts.join(" ")};;;`);
    if (c.companyName) lines.push(`ORG:${c.companyName}`);
  } else {
    lines.push(`N:${c.name};;;;`);
    lines.push(`ORG:${c.name}`);
  }
  lines.push(`TITLE:${c.category.name}`);
  if (c.phone)   lines.push(`TEL;TYPE=CELL:${c.phone}`);
  if (c.altPhone) lines.push(`TEL;TYPE=WORK:${c.altPhone}`);
  if (c.email)   lines.push(`EMAIL:${c.email}`);
  if (c.address) lines.push(`ADR;TYPE=HOME:;;${c.address};;;;`);
  if (c.website) lines.push(`URL:${c.website}`);
  if (c.notes)   lines.push(`NOTE:${c.notes}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function ShareContactSheet({ open, onOpenChange, contact }: ShareContactSheetProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPlainText(contact));
      setCopied(true);
      toast({ title: "Copied!", description: "Contact details copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  }

  function handleWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildPlainText(contact))}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function handleDownloadVCard() {
    const blob = new Blob([buildVCard(contact)], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contact.name.replace(/\s+/g, "_")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "vCard downloaded", description: "Save it to your phone contacts." });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4 text-left">
          <SheetTitle>Share contact</SheetTitle>
          <SheetDescription>
            Share <strong>{contact.name}</strong> ({contact.category.name})
          </SheetDescription>
        </SheetHeader>

        <pre className="mb-4 whitespace-pre-wrap rounded-md bg-gray-50 px-4 py-3 text-[12px] leading-relaxed text-gray-600">
          {buildPlainText(contact)}
        </pre>

        <Separator className="my-4" />

        <div className="flex flex-col gap-3">
          <Button variant="outline" className="w-full justify-start gap-3" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy to clipboard"}
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-green-200 text-green-700 hover:bg-green-50"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            Share via WhatsApp
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-violet-200 text-violet-700 hover:bg-violet-50"
            onClick={handleDownloadVCard}
          >
            <Download className="h-4 w-4" />
            Download vCard (.vcf)
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
