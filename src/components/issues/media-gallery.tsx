"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, FileVideo, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  filename: string;
}

interface MediaGalleryProps {
  attachments: Attachment[];
}

export function MediaGallery({ attachments }: MediaGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const handleShare = async (attachment: Attachment) => {
    const shareData = {
      title: attachment.filename,
      text: attachment.filename,
      url: attachment.url,
    };

    // Use native Web Share API (works with WhatsApp, Messages, etc. on mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or error — do nothing
      }
    } else {
      // Desktop fallback: open WhatsApp web share
      const waUrl = `https://wa.me/?text=${encodeURIComponent(attachment.filename + "\n" + attachment.url)}`;
      window.open(waUrl, "_blank");
    }
  };

  if (attachments.length === 0) return null;

  const images = attachments.filter((a) => a.type === "IMAGE");
  const videos = attachments.filter((a) => a.type === "VIDEO");

  return (
    <>
      <div className="space-y-3">
        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-3"}`}>
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightboxIndex(attachments.findIndex((a) => a.id === img.id))}
                className="relative overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.filename}
                  className="w-full h-40 object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {videos.map((video) => (
          <div key={video.id} className="rounded-lg border overflow-hidden">
            <video
              src={video.url}
              controls
              className="w-full max-h-64"
              preload="metadata"
            />
            <p className="text-xs text-gray-500 px-2 py-1 flex items-center gap-1">
              <FileVideo className="h-3 w-3" />
              {video.filename}
            </p>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Share button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-16 text-white hover:bg-white/20"
            title="Share"
            onClick={(e) => {
              e.stopPropagation();
              handleShare(attachments[lightboxIndex]);
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>

          {lightboxIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex - 1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl max-h-full">
            {attachments[lightboxIndex].type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={attachments[lightboxIndex].url}
                alt={attachments[lightboxIndex].filename}
                className="max-h-[80vh] max-w-full object-contain rounded"
              />
            ) : (
              <video
                src={attachments[lightboxIndex].url}
                controls
                autoPlay
                className="max-h-[80vh] max-w-full rounded"
              />
            )}
            <p className="text-white text-center text-sm mt-2 opacity-70">
              {attachments[lightboxIndex].filename} &middot; {lightboxIndex + 1} / {attachments.length}
            </p>
          </div>

          {lightboxIndex < attachments.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(lightboxIndex + 1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}
        </div>
      )}
    </>
  );
}
