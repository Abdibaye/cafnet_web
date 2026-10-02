"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { uploadImageFlow, validateImageFile } from "@/lib/api/media";
import type { Media, TargetType } from "@/lib/api/types";

interface ImageUploadProps {
  targetType: TargetType;
  targetId?: string;
  initialImageUrl?: string;
  currentImageUrl?: string;
  label?: string;
  description?: string;
  aspectRatio?: "square" | "video" | "banner";
  required?: boolean;
  disabled?: boolean;
  onUploadComplete?: (media: Media) => void;
  onRemove?: () => void;
  className?: string;
}

export default function ImageUpload({
  targetType,
  targetId,
  initialImageUrl,
  currentImageUrl,
  label = "Upload Image",
  description = "PNG, JPG or WebP up to 10MB",
  aspectRatio = "video",
  required = false,
  disabled = false,
  onUploadComplete,
  onRemove,
  className = "",
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || initialImageUrl || null,
  );
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectRatioClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "banner"
        ? "aspect-[21/9]"
        : "aspect-[16/9]";

  const handleFileProcess = useCallback(
    async (file: File) => {
      setError(null);

      // Validate
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      // Generate local preview immediately for great UX
      const localUrl = URL.createObjectURL(file);
      setPreviewUrl(localUrl);
      setIsUploading(true);
      setProgress(0);

      try {
        const completedMedia = await uploadImageFlow({
          file,
          targetType,
          targetId,
          onProgress: (pct) => setProgress(pct),
        });

        // Set authoritative permanent public URL from Tigris
        if (completedMedia.url) {
          setPreviewUrl(completedMedia.url);
        }
        if (onUploadComplete) {
          onUploadComplete(completedMedia);
        }
      } catch (err: any) {
        console.error("Direct upload failed:", err);
        setError(
          err?.message ||
            "Failed to upload image. Please check your network and try again.",
        );
        // Reset preview if upload failed
        setPreviewUrl(initialImageUrl || null);
      } finally {
        setIsUploading(false);
        setProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [targetType, targetId, initialImageUrl, onUploadComplete],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
  };

  const triggerPicker = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-on-surface mb-2">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isUploading}
      />

      {/* Main Container */}
      <div
        onClick={triggerPicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative w-full ${aspectRatioClass} max-h-[360px] rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center cursor-pointer select-none ${
          isDragOver
            ? "border-primary bg-primary/5 scale-[0.99]"
            : previewUrl
              ? "border-outline-variant/60 bg-surface-container hover:border-primary/50"
              : "border-outline-variant/80 bg-surface-container-low hover:border-primary hover:bg-primary/5"
        } ${disabled || isUploading ? "pointer-events-none opacity-80" : ""}`}
      >
        {/* Preview State */}
        {previewUrl ? (
          <div className="relative w-full h-full group">
            <Image
              src={previewUrl}
              alt={label || "Uploaded media preview"}
              fill
              className="object-cover transition-transform group-hover:scale-[1.02] duration-300"
              sizes="(max-width: 768px) 100vw, 600px"
              unoptimized={previewUrl.startsWith("blob:") || previewUrl.startsWith("http://localhost")}
            />

            {/* Hover overlay with action buttons */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerPicker();
                }}
                className="px-4 py-2 bg-white/95 text-on-surface hover:bg-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Change photo
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-4 py-2 bg-error text-white hover:bg-red-700 text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Quick remove badge in corner */}
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                title="Remove photo"
                className="absolute top-3 right-3 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition z-10"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ) : (
          /* Empty / Upload Prompt State */
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-semibold text-on-surface">
              Click to select or drag and drop image
            </p>
            <p className="text-xs text-on-surface-variant mt-1.5">
              {description}
            </p>
          </div>
        )}

        {/* Uploading progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 z-20">
            <div className="w-full max-w-xs bg-white/20 rounded-full h-2.5 mb-3 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-200"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <p className="text-xs font-semibold text-white tracking-wide">
              Uploading directly to Tigris... {progress > 0 ? `${progress}%` : ""}
            </p>
            <p className="text-[11px] text-white/70 mt-1">
              Validating and storing image
            </p>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mt-2.5 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start justify-between text-xs text-error">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-error font-bold ml-2 hover:opacity-80"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
