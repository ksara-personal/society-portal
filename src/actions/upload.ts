"use server";

import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/session";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadFile(formData: FormData) {
  await requireAuth();

  const file = formData.get("file") as File;
  if (!file) return { error: "No file provided" };

  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return {
      error: "File type not allowed. Use JPG, PNG, WebP, MP4, or WebM.",
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return { error: "Image must be under 10MB" };
  }

  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return { error: "Video must be under 50MB" };
  }

  const blob = await put(`issues/${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  return {
    success: true,
    url: blob.url,
    type: isImage ? "IMAGE" : "VIDEO",
    filename: file.name,
    size: file.size,
  };
}
