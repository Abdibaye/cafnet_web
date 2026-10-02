import { api } from "./client";
import type {
  BusinessMedia,
  CompleteUploadResponse,
  CreateUploadInput,
  Media,
  PresignedUploadResponse,
  ReorderMediaInput,
  TargetType,
} from "./types";

export type {
  BusinessMedia,
  CompleteUploadResponse,
  CreateUploadInput,
  Media,
  PresignedUploadResponse,
  ReorderMediaInput,
  TargetType,
};

export const MAX_MEDIA_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export interface FileValidationError {
  valid: boolean;
  error?: string;
}

/**
 * Validates file MIME type and size prior to presigned URL generation.
 */
export function validateImageFile(file: File): FileValidationError {
  if (!file) {
    return { valid: false, error: "Please select an image file." };
  }

  const mime = file.type.toLowerCase();
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mime)) {
    return {
      valid: false,
      error: `Unsupported image format (${mime || "unknown"}). Supported formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size <= 0) {
    return { valid: false, error: "Image file cannot be empty." };
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMb} MB). Maximum size allowed is 10 MB.`,
    };
  }

  return { valid: true };
}

/**
 * Initiates an authorized upload session and receives a deterministic presigned PUT URL.
 */
export async function createUpload(
  input: CreateUploadInput,
): Promise<PresignedUploadResponse> {
  const res = await api.post<PresignedUploadResponse>(
    "/api/v1/media/uploads",
    input,
  );
  return res.data;
}

/**
 * Direct browser PUT to Tigris object storage via presigned URL with progress tracking.
 */
export async function uploadToTigris(
  uploadUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (progressPercent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    if (onProgress && xhr.upload) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `Direct storage upload failed with status ${xhr.status}: ${xhr.statusText}`,
          ),
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error during direct image upload."));
    };

    xhr.onabort = () => {
      reject(new Error("Image upload was cancelled."));
    };

    xhr.send(file);
  });
}

/**
 * Authoritatively verifies storage object existence and updates status to READY.
 */
export async function completeUpload(mediaId: string): Promise<Media> {
  const res = await api.post<CompleteUploadResponse>(
    `/api/v1/media/uploads/${mediaId}/complete`,
  );
  return res.data.media;
}

/**
 * Convenience orchestrator for the entire client -> presigned -> Tigris -> complete lifecycle.
 */
export async function uploadImageFlow(params: {
  file: File;
  targetType: TargetType;
  targetId?: string;
  onProgress?: (percent: number) => void;
}): Promise<Media> {
  const { file, targetType, targetId, onProgress } = params;

  // 1. Client-side validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Request Presigned URL
  const presign = await createUpload({
    target_type: targetType,
    target_id: targetId,
    content_type: file.type,
    file_size: file.size,
  });

  // 3. Direct browser PUT to Tigris
  await uploadToTigris(presign.upload_url, file, file.type, onProgress);

  // 4. Verification and completion
  const completedMedia = await completeUpload(presign.media_id);
  return completedMedia;
}

/**
 * Permanently removes a media asset from Tigris and database.
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  await api.delete(`/api/v1/media/${mediaId}`);
}

/**
 * Retrieves all ready cover and gallery media for a business.
 */
export async function getBusinessMedia(
  businessId: number | string,
): Promise<BusinessMedia> {
  try {
    const res = await api.get<any>(
      `/api/v1/businesses/${businessId}/media`,
    );
    const data = res.data;

    // Handle array response from Go slice (domain.BusinessMedia[])
    if (Array.isArray(data)) {
      let cover: Media | null = null;
      const gallery: Media[] = [];

      for (const item of data) {
        if (!item) continue;
        const normalized: Media = {
          id: String(item.id || ""),
          created_by_user_id: String(item.created_by_user_id || ""),
          business_id: Number(businessId),
          media_type: item.type || item.media_type || "BUSINESS_GALLERY",
          object_key: item.object_key || "",
          content_type: item.content_type || "image/jpeg",
          file_size: item.file_size || 0,
          status: item.status || "READY",
          sort_order: item.sort_order || 0,
          url: item.url || "",
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        };

        const itemType = String(item.type || item.media_type || "").toUpperCase();
        if (itemType === "BUSINESS_COVER") {
          if (!cover) {
            cover = normalized;
          }
        } else {
          gallery.push(normalized);
        }
      }

      return { cover, gallery };
    }

    // Handle { cover: ..., gallery: [...] } shape
    if (data && typeof data === "object") {
      const cover = data.cover
        ? {
            ...data.cover,
            id: String(data.cover.id || ""),
            url: data.cover.url || "",
          }
        : null;

      const gallery = Array.isArray(data.gallery)
        ? data.gallery.map((g: any) => ({
            ...g,
            id: String(g.id || ""),
            url: g.url || "",
            sort_order: g.sort_order || 0,
          }))
        : [];

      return { cover, gallery };
    }
  } catch {
    return { cover: null, gallery: [] };
  }

  return { cover: null, gallery: [] };
}

/**
 * Sets a specific business gallery photo as the primary cover image.
 */
export async function setBusinessCover(
  businessId: number | string,
  mediaId: string,
): Promise<void> {
  await api.put(`/api/v1/businesses/${businessId}/media/cover`, {
    media_id: mediaId,
  });
}

/**
 * Persists an ordered sequence of gallery media IDs for a business.
 */
export async function reorderBusinessGallery(
  businessId: number | string,
  mediaIds: string[],
): Promise<void> {
  const payload: ReorderMediaInput = { media_ids: mediaIds };
  await api.put(
    `/api/v1/businesses/${businessId}/media/gallery/reorder`,
    payload,
  );
}

/**
 * Removes an associated image from a menu item.
 */
export async function deleteMenuItemMedia(
  businessIdOrItemId: number | string,
  maybeItemId?: string,
): Promise<void> {
  const itemId = maybeItemId || String(businessIdOrItemId);
  await api.delete(`/api/v1/menu/items/${itemId}/image`);
}

/**
 * Retrieves cover media for a pending or reviewed submission.
 */
export async function getSubmissionCover(
  submissionId: string,
): Promise<BusinessMedia | null> {
  const res = await api.get<BusinessMedia | { cover: null }>(
    `/api/v1/submissions/${submissionId}/cover`,
  );
  if ("cover" in res.data && res.data.cover === null) {
    return null;
  }
  return res.data as BusinessMedia;
}
