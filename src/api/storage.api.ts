import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { logger } from "@/utils/logger";
import { CollectionSchema } from "@/models/collection.model";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

export interface FileUploadResult {
  key?: string;
  path?: string;
  filename?: string;
  size?: number;
  collection?: CollectionSchema;
  error?: string;
}

/**
 * Uploads a collection's featured image to Cloudflare R2 and updates the database record.
 * R2 path: {CLOUDFLARE_R2_FOLDER_PREFIX}/tenant_id/project_id/<uploaded_image_name>
 * Database path: tenant_id/project_id/<uploaded_image_name>
 */
export async function uploadCollectionFeaturedImageApi(
  collectionId: string,
  file: File,
  projectId?: string
): Promise<FileUploadResult> {
  const selectedProjId = projectId || getSelectedProjectId();
  const headers = { ...getCollectionHeaders(selectedProjId || undefined) };
  // Let the browser set Content-Type with multipart boundary
  delete headers["Content-Type"];

  const formData = new FormData();
  formData.append("file", file);

  logger.info(`Uploading featured image for collection ${collectionId} to Cloudflare R2...`);

  try {
    const url = `${API_BASE_URL}/collections/${collectionId}/featured-image${
      selectedProjId ? `?project_id=${encodeURIComponent(selectedProjId)}` : ""
    }`;
    const res = await apiFetch(url, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      logger.success("Collection featured image uploaded to Cloudflare R2 successfully.", data);
      return {
        collection: data,
        path: data.featured_image,
      };
    } else {
      const errMsg =
        typeof data.detail === "string"
          ? data.detail
          : data.error || data.message || "Failed to upload image to Cloudflare R2";
      logger.error("Failed to upload featured image:", errMsg);
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error uploading featured image to Cloudflare R2:", err);
    return { error: err?.message || "Network error uploading image" };
  }
}
