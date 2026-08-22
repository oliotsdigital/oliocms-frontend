import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { logger } from "@/utils/logger";
import {
  CollectionSchema,
  CollectionRecord,
  CreateCollectionPayload,
} from "@/models/collection.model";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function resolveProjectId(projectId?: string): string | null {
  return projectId || getSelectedProjectId();
}

export async function fetchCollectionsApi(projectId?: string): Promise<CollectionSchema[]> {
  const selectedProjId = resolveProjectId(projectId);

  if (!selectedProjId) {
    logger.info("Skipping collections fetch; no project selected.");
    return [];
  }

  logger.info(`Fetching collection schemas for project ${selectedProjId}...`);
  try {
    const url = `${API_BASE_URL}/collections?project_id=${encodeURIComponent(selectedProjId)}`;
    const res = await apiFetch(url, {
      headers: getCollectionHeaders(selectedProjId),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json.data || json.items || json;
      if (Array.isArray(items)) {
        logger.success(`Fetched ${items.length} collection schemas from API.`);
        return items;
      }
    } else {
      logger.warn(`Failed to fetch collections (Status: ${res.status})`);
    }
  } catch (err) {
    logger.warn("Failed to fetch collections from API:", err);
  }
  return [];
}

export async function fetchCollectionSchemaApi(
  collectionId: string,
  projectId?: string
): Promise<CollectionSchema | null> {
  if (!isUuid(collectionId)) {
    logger.warn(`Skipping collection schema fetch; id is not a UUID: ${collectionId}`);
    return null;
  }
  const selectedProjId = resolveProjectId(projectId);
  if (!selectedProjId) {
    logger.warn("Skipping collection schema fetch; no project selected.");
    return null;
  }
  logger.info(`Fetching collection schema details for ID: ${collectionId}`);
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/collections/${collectionId}?project_id=${encodeURIComponent(selectedProjId)}`,
      {
        headers: getCollectionHeaders(selectedProjId),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    logger.warn(`Failed to fetch collection schema ${collectionId} from API:`, err);
  }
  return null;
}

export async function createCollectionSchemaApi(
  payload: CreateCollectionPayload
): Promise<{ collection?: CollectionSchema; error?: string }> {
  const selectedProjId = resolveProjectId(payload.project_id);
  if (!selectedProjId) {
    return { error: "Select a website before creating a collection." };
  }
  const fullPayload = {
    ...payload,
    project_id: selectedProjId,
  };

  logger.info("Creating collection schema...", fullPayload);
  try {
    const res = await apiFetch(`${API_BASE_URL}/collections`, {
      method: "POST",
      headers: getCollectionHeaders(selectedProjId),
      body: JSON.stringify(fullPayload),
    });
    const data = await res.json();
    if (res.ok) {
      logger.success("Collection schema created successfully on API.", data);
      return { collection: data };
    } else {
      const errMsg =
        typeof data.detail === "string"
          ? data.detail
          : data.error || data.message || "Failed to create collection schema";
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error creating collection schema:", err);
    return { error: err?.message || "Network error creating collection schema" };
  }
}

export async function updateCollectionSchemaApi(
  collectionId: string,
  payload: { name?: string; icon?: string; featured_image?: string; api_id_singular?: string; api_id_plural?: string; schema_definition?: any[] }
): Promise<{ collection?: CollectionSchema; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { error: "Select a website before updating a collection." };
  }
  logger.info(`Updating collection schema ID: ${collectionId}...`, payload);
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/collections/${collectionId}?project_id=${encodeURIComponent(selectedProjId)}`,
      {
        method: "PUT",
        headers: getCollectionHeaders(selectedProjId),
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (res.ok) {
      logger.success("Collection schema updated successfully on API.", data);
      return { collection: data };
    } else {
      const errMsg =
        typeof data.detail === "string"
          ? data.detail
          : data.error || data.message || "Failed to update collection schema";
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error updating collection schema:", err);
    return { error: err?.message || "Network error updating collection schema" };
  }
}

export async function deleteCollectionSchemaApi(
  collectionId: string
): Promise<{ success: boolean; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { success: false, error: "Select a website before deleting a collection." };
  }
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/collections/${collectionId}?project_id=${encodeURIComponent(selectedProjId)}`,
      {
        method: "DELETE",
        headers: getCollectionHeaders(selectedProjId),
      }
    );
    if (res.ok || res.status === 204) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || data.detail || "Failed to delete schema" };
  } catch (err: any) {
    logger.error("Network error deleting collection schema:", err);
    return { success: false, error: err?.message || "Network error deleting collection schema" };
  }
}

export async function fetchCollectionRecordsApi(
  collectionId: string,
  filters?: Record<string, string>
): Promise<CollectionRecord[]> {
  if (!isUuid(collectionId)) {
    logger.warn(`Skipping collection records fetch; id is not a UUID: ${collectionId}`);
    return [];
  }
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    logger.warn("Skipping collection records fetch; no project selected.");
    return [];
  }
  logger.info(`Fetching records for collection ${collectionId}...`, filters);
  try {
    const queryParams = new URLSearchParams();
    queryParams.set("project_id", selectedProjId);
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") queryParams.append(k, v);
      });
    }
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}/records?${queryParams}`, {
      headers: getCollectionHeaders(selectedProjId),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json.data || json.items || json;
      if (Array.isArray(items)) {
        logger.success(`Fetched ${items.length} records from API.`);
        return items;
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch collection records from API:", err);
  }
  return [];
}

export async function createCollectionRecordApi(
  collectionId: string,
  data: Record<string, any>
): Promise<{ record?: CollectionRecord; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { error: "Select a website before creating a record." };
  }
  logger.info(`Ingesting record for collection ${collectionId}`, data);
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/collections/${collectionId}/records?project_id=${encodeURIComponent(selectedProjId)}`,
      {
        method: "POST",
        headers: getCollectionHeaders(selectedProjId),
        body: JSON.stringify({ data }),
      }
    );
    const resJson = await res.json();
    if (res.ok) {
      logger.success("Record created successfully on backend API.", resJson);
      return { record: resJson };
    } else {
      const errMsg =
        typeof resJson.detail === "string"
          ? resJson.detail
          : resJson.error || resJson.message || "Record validation failed";
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error creating collection record:", err);
    return { error: err?.message || "Network error creating collection record" };
  }
}

export async function deleteCollectionRecordApi(
  collectionId: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { success: false, error: "Select a website before deleting a record." };
  }
  try {
    const res = await apiFetch(
      `${API_BASE_URL}/collections/${collectionId}/records/${recordId}?project_id=${encodeURIComponent(selectedProjId)}`,
      {
        method: "DELETE",
        headers: getCollectionHeaders(selectedProjId),
      }
    );
    if (res.ok || res.status === 204) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || data.detail || "Failed to delete record" };
  } catch (err: any) {
    logger.error("Network error deleting collection record:", err);
    return { success: false, error: err?.message || "Network error deleting collection record" };
  }
}
