import { APP_CONFIG } from "@/config/app.config";

export const DEFAULT_LAZY_IMAGE = "/images/lazy_loading.png";

/**
 * Resolves a media path or URL into a viewable image URL.
 * Supports external URLs (http/https), data URLs, blob URLs, and Cloudflare R2 tenant paths (e.g. tenant_id/image.jpg).
 * If no path/URL is provided, or if empty, returns the default fallback image (/images/lazy_loading.png).
 */
export function resolveMediaUrl(
  pathOrUrl?: string | null,
  fallback: string = DEFAULT_LAZY_IMAGE
): string {
  if (!pathOrUrl || !pathOrUrl.trim()) return fallback;
  const trimmed = pathOrUrl.trim();

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // If it's a local public asset path (e.g., /images/lazy_loading.png)
  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  // Remove leading slashes
  const cleanPath = trimmed.replace(/^\/+/, "");
  return `${APP_CONFIG.apiBaseUrl}/storage/media/${cleanPath}`;
}

