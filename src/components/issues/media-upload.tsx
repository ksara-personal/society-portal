"use client";

import { useState, useCallback } from "react";
import { Upload, X, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFile } from "@/actions/upload";
import { formatBytes } from "@/lib/utils";

export interface UploadedFile {
  url: string;
  type: "IMAGE" | "VIDEO";
  filename: string;
  size: number;
}

interface MediaUploadProps {
  onFilesChange: (files: UploadedFile[]) => void;
  maxImages?: number;
  maxVideos?: number;
  initialFiles?: UploadedFile[];
}

export function MediaUpload({
  onFilesChange,
  maxImages = 5,
  maxVideos = 1,
  initialFiles = [],
}: MediaUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = useCallback(
    async (fileList: FileList) => {
      setError("");
      setUploading(true);

      const newFiles: UploadedFile[] = [...files];

      for (const file of Array.from(fileList)) {
        const isVideo = file.type.startsWith("video/");
        const currentImages = newFiles.filter((f) => f.type === "IMAGE").length;
        const currentVideos = newFiles.filter((f) => f.type === "VIDEO").length;

        if (!isVideo && currentImages >= maxImages) {
          setError(`Maximum ${maxImages} images allowed`);
          break;
        }
        if (isVideo && currentVideos >= maxVideos) {
          setError(`Maximum ${maxVideos} video allowed`);
          break;
        }

        const formData = new FormData();
        formData.append("file", file);
        const result = await uploadFile(formData);

        if ("error" in result && result.error) {
          setError(result.error);
        } else if ("success" in result && result.success) {
          newFiles.push({
            url: result.url!,
            type: result.type as "IMAGE" | "VIDEO",
            filename: result.filename!,
            size: result.size!,
          });
        }
      }

      setFiles(newFiles);
      onFilesChange(newFiles);
      setUploading(false);
    },
    [files, maxImages, maxVideos, onFilesChange]
  );

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange(updated);
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleUpload(e.dataTransfer.files);
        }}
        onClick={() => document.getElementById("gvr-file-input")?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {uploading ? (
            <span className="text-primary font-medium">Uploading…</span>
          ) : (
            "Drag & drop files or click to browse"
          )}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Images: JPG, PNG, WebP (max 10MB) &middot; Video: MP4, WebM (max
          50MB)
        </p>
        <input
          id="gvr-file-input"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative group rounded-lg overflow-hidden border bg-gray-50"
            >
              {file.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={file.url}
                  alt={file.filename}
                  className="w-full h-24 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 flex flex-col items-center justify-center gap-1">
                  <FileVideo className="h-8 w-8 text-gray-400" />
                  <span className="text-xs text-gray-500">Video</span>
                </div>
              )}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="text-[10px] text-gray-500 p-1 truncate">
                {file.filename} ({formatBytes(file.size)})
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
