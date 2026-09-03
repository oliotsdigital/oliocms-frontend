import { APP_CONFIG } from "@/config/app.config";

/**
 * Resolves a media path or URL into a viewable image URL.
 * Supports external URLs (http/https), data URLs, blob URLs, and Cloudflare R2 tenant paths (e.g. tenant_id/image.jpg).
 */
export function resolveMediaUrl(pathOrUrl?: string | null): string {
  if (!pathOrUrl || !pathOrUrl.trim()) return "";
  const trimmed = pathOrUrl.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // Remove leading slashes
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${APP_CONFIG.apiBaseUrl}/storage/media/${cleanPath}`;
}
