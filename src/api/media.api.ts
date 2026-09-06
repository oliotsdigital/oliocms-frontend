import { MediaItem, NewMediaForm } from "@/models/media.model";
import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { resolveMediaUrl } from "@/utils/media";
import { logger } from "@/utils/logger";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function resolveItemUrl(item: { url?: string | null; path?: string | null; public_url?: string | null }): string {
  if (item.public_url && item.public_url.trim()) {
    return item.public_url.trim();
  }
  if (item.url && item.url.trim()) {
    const u = item.url.trim();
    if (u.startsWith("http://") || u.startsWith("https://")) {
      return u;
    }
    const cleanLeading = u.startsWith("/") ? u : `/${u}`;
    return `${APP_CONFIG.apiBaseUrl}${cleanLeading}`;
  }
  if (item.path && item.path.trim()) {
    return resolveMediaUrl(item.path);
  }
  return "";
}

/**
 * Fetch all media files in Cloudflare R2 under /{CLOUDFLARE_R2_FOLDER_PREFIX}/{tenant_id}/{project_id}/.
 */
export async function fetchMediaApi(projectId?: string): Promise<MediaItem[]> {
  const selectedProjId = projectId || getSelectedProjectId();
  if (!selectedProjId) {
    return [];
  }

  const headers = getCollectionHeaders(selectedProjId);
  const url = `${APP_CONFIG.apiBaseUrl}/storage/files?project_id=${encodeURIComponent(selectedProjId)}`;

  try {
    const res = await apiFetch(url, { headers });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      logger.error("Failed to fetch media files from Cloudflare R2:", errText);
      return [];
    }

    const data = await res.json();
    const files = data.files || [];

    return files.map((file: any) => {
      const filename = file.filename || "file";
      const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() || "file" : "file";
      const fileUrl = resolveItemUrl(file);

      return {
        id: file.key || file.path || filename,
        key: file.key,
        path: file.path,
        name: filename,
        url: fileUrl,
        size: formatBytes(file.size || 0),
        format: file.format || ext,
        lastModified: file.last_modified,
      };
    });
  } catch (err) {
    logger.error("Network error fetching media files:", err);
    return [];
  }
}

/**
 * Upload an asset directly to /{CLOUDFLARE_R2_FOLDER_PREFIX}/{tenant_id}/{project_id}/ in Cloudflare R2.
 */
export async function uploadMediaApi(
  formOrFile: NewMediaForm | File,
  projectId?: string
): Promise<MediaItem | null> {
  const selectedProjId = projectId || getSelectedProjectId();
  const headers = { ...getCollectionHeaders(selectedProjId || undefined) };
  delete headers["Content-Type"];

  const formData = new FormData();

  if (formOrFile instanceof File) {
    formData.append("file", formOrFile);
  } else if (formOrFile.file) {
    formData.append("file", formOrFile.file);
  } else if (formOrFile.url) {
    // If only URL provided without a file, return as client-side media reference
    return {
      id: Date.now(),
      name: formOrFile.name || "external-image",
      url: formOrFile.url,
      size: "External",
      format: formOrFile.url.split(".").pop()?.split("?")[0]?.toLowerCase() || "url",
    };
  } else {
    throw new Error("No file provided for upload.");
  }

  if (selectedProjId) {
    formData.append("project_id", selectedProjId);
  }

  const url = `${APP_CONFIG.apiBaseUrl}/storage/upload`;
  const res = await apiFetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errMsg = errorData.detail || errorData.message || "Failed to upload file to Cloudflare R2";
    throw new Error(errMsg);
  }

  const data = await res.json();
  const filename = data.filename || "file";
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() || "file" : "file";
  const fileUrl = resolveItemUrl(data);

  return {
    id: data.key || data.path || filename,
    key: data.key,
    path: data.path,
    name: filename,
    url: fileUrl,
    size: formatBytes(data.size || 0),
    format: ext,
    lastModified: data.uploaded_at,
  };
}

export interface ZipUploadResult {
  success: boolean;
  message: string;
  total_extracted: number;
  files: MediaItem[];
}

/**
 * Upload a ZIP archive to /storage/upload-zip. The server extracts all files in-memory
 * and stores each extracted file in Cloudflare R2 under /{CLOUDFLARE_R2_FOLDER_PREFIX}/{tenant_id}/{project_id}/.
 */
export async function uploadZipMediaApi(
  file: File,
  projectId?: string
): Promise<ZipUploadResult> {
  const selectedProjId = projectId || getSelectedProjectId();
  const headers = { ...getCollectionHeaders(selectedProjId || undefined) };
  delete headers["Content-Type"];

  const formData = new FormData();
  formData.append("file", file);
  if (selectedProjId) {
    formData.append("project_id", selectedProjId);
  }

  const url = `${APP_CONFIG.apiBaseUrl}/storage/upload-zip`;
  const res = await apiFetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errMsg =
      errorData.detail ||
      errorData.message ||
      "Failed to extract and upload ZIP archive to Cloudflare R2";
    throw new Error(errMsg);
  }

  const data = await res.json();
  const files: MediaItem[] = (data.files || []).map((item: any) => {
    const filename = item.filename || "file";
    const ext = filename.includes(".")
      ? filename.split(".").pop()?.toLowerCase() || "file"
      : "file";
    return {
      id: item.key || item.path || filename,
      key: item.key,
      path: item.path,
      name: filename,
      url: resolveItemUrl(item),
      size: formatBytes(item.size || 0),
      format: ext,
      lastModified: item.uploaded_at,
    };
  });

  return {
    success: Boolean(data.success),
    message: data.message || `Successfully extracted ${files.length} files`,
    total_extracted: data.total_extracted ?? files.length,
    files,
  };
}

/**
 * Delete a media file from Cloudflare R2.
 */
export async function deleteMediaApi(keyOrPath: string, projectId?: string): Promise<boolean> {
  const selectedProjId = projectId || getSelectedProjectId();
  const headers = getCollectionHeaders(selectedProjId || undefined);
  const url = `${APP_CONFIG.apiBaseUrl}/storage/file?key=${encodeURIComponent(keyOrPath)}`;

  try {
    const res = await apiFetch(url, {
      method: "DELETE",
      headers,
    });
    return res.ok;
  } catch (err) {
    logger.error("Failed to delete media asset:", err);
    return false;
  }
}
