import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { logger } from "@/utils/logger";
import {
  CollectionSchema,
  CollectionRecord,
  CreateCollectionPayload,
  PaginatedRecordsResponse,
  BatchImportResult,
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

function normalizeCollectionRecord(item: unknown): CollectionRecord | null {
  if (!item || typeof item !== "object") return null;
  const raw = item as Record<string, any>;
  if (!raw.id) return null;

  const nestedData =
    raw.data && typeof raw.data === "object" && !Array.isArray(raw.data) ? raw.data : null;

  return {
    id: String(raw.id),
    data: nestedData || {},
    created_at: raw.created_at || "",
    updated_at: raw.updated_at || raw.created_at || "",
  };
}

export async function fetchCollectionsApi(projectId?: string): Promise<CollectionSchema[]> {
  const selectedProjId = resolveProjectId(projectId);

  if (!selectedProjId) {
    logger.info("Skipping collections fetch; no project selected.");
    return [];
  }

  logger.info(`Fetching collection schemas for project ${selectedProjId}...`);
  try {
    const res = await apiFetch(`${API_BASE_URL}/collections`, {
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
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}`, {
      headers: getCollectionHeaders(selectedProjId),
    });
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
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      logger.success("Collection schema created successfully on API.", data);
      return { collection: data };
    } else {
      let errMsg = "Failed to create collection schema";
      if (Array.isArray(data.details) && data.details.length > 0) {
        errMsg = data.details
          .map((d: any) => `${d.location?.filter((x: any) => x !== "body")?.join(".") || "field"}: ${d.message}`)
          .join(", ");
      } else if (typeof data.error === "string") {
        errMsg = data.error;
      } else if (typeof data.detail === "string") {
        errMsg = data.detail;
      } else if (data.message) {
        errMsg = data.message;
      }
      logger.error("Failed to create collection schema:", errMsg, data);
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error creating collection schema:", err);
    return { error: err?.message || "Network error creating collection schema" };
  }
}

export async function updateCollectionSchemaApi(
  collectionId: string,
  payload: {
    name?: string;
    icon?: string;
    featured_image?: string;
    api_id_singular?: string;
    api_id_plural?: string;
    schema_definition?: any[];
    is_public?: boolean;
  }
): Promise<{ collection?: CollectionSchema; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { error: "Select a website before updating a collection." };
  }
  logger.info(`Updating collection schema ID: ${collectionId}...`, payload);
  try {
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "PUT",
      headers: getCollectionHeaders(selectedProjId),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      logger.success("Collection schema updated successfully on API.", data);
      return { collection: data };
    } else {
      let errMsg = "Failed to update collection schema";
      if (Array.isArray(data.details) && data.details.length > 0) {
        errMsg = data.details
          .map((d: any) => `${d.location?.filter((x: any) => x !== "body")?.join(".") || "field"}: ${d.message}`)
          .join(", ");
      } else if (typeof data.error === "string") {
        errMsg = data.error;
      } else if (typeof data.detail === "string") {
        errMsg = data.detail;
      } else if (data.message) {
        errMsg = data.message;
      }
      logger.error("Failed to update collection schema:", errMsg, data);
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
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "DELETE",
      headers: getCollectionHeaders(selectedProjId),
    });
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
): Promise<PaginatedRecordsResponse> {
  if (!isUuid(collectionId)) {
    logger.warn(`Skipping collection records fetch; id is not a UUID: ${collectionId}`);
    return { data: [], total: 0, limit: 10, offset: 0, has_more: false };
  }
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    logger.warn("Skipping collection records fetch; no project selected.");
    return { data: [], total: 0, limit: 10, offset: 0, has_more: false };
  }
  logger.info(`Fetching records for collection ${collectionId}...`, filters);
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") queryParams.append(k, v);
      });
    }
    const qs = queryParams.toString();
    const url = qs
      ? `${API_BASE_URL}/collections/${collectionId}/records?${qs}`
      : `${API_BASE_URL}/collections/${collectionId}/records`;
    const res = await apiFetch(url, {
      headers: getCollectionHeaders(selectedProjId),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json.data || json.items || (Array.isArray(json) ? json : []);
      const total = typeof json.meta?.total === "number" ? json.meta.total : items.length;
      const limit = typeof json.meta?.limit === "number" ? json.meta.limit : items.length;
      const offset = typeof json.meta?.offset === "number" ? json.meta.offset : 0;
      const has_more = typeof json.meta?.has_more === "boolean" ? json.meta.has_more : false;

      if (Array.isArray(items)) {
        const records = items
          .map(normalizeCollectionRecord)
          .filter((record): record is CollectionRecord => record !== null);
        logger.success(`Fetched ${records.length} records from API (Total: ${total}).`);
        return { data: records, total, limit, offset, has_more };
      }
    }
  } catch (err) {
    logger.warn("Failed to fetch collection records from API:", err);
  }
  return { data: [], total: 0, limit: 10, offset: 0, has_more: false };
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
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}/records`, {
      method: "POST",
      headers: getCollectionHeaders(selectedProjId),
      body: JSON.stringify({ data }),
    });
    const resJson = await res.json();
    if (res.ok) {
      logger.success("Record created successfully on backend API.", resJson);
      return { record: normalizeCollectionRecord(resJson.data || resJson) || undefined };
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

function toCount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeBatchErrors(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];
  return errors.map((err) => {
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const obj = err as Record<string, unknown>;
      if (typeof obj.message === "string") {
        const row = obj.row ?? obj.index ?? obj.line;
        return row != null ? `Row ${row}: ${obj.message}` : obj.message;
      }
      try {
        return JSON.stringify(err);
      } catch {
        return "Unknown import error";
      }
    }
    return String(err);
  });
}

export async function batchCreateCollectionRecordsApi(
  collectionId: string,
  records: Record<string, any>[]
): Promise<BatchImportResult> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return {
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      failedCount: 0,
      errors: [],
      error: "Select a website before importing records.",
    };
  }
  logger.info(`Batch importing ${records.length} records for collection ${collectionId}`);
  try {
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}/records/batch`, {
      method: "POST",
      headers: getCollectionHeaders(selectedProjId),
      body: JSON.stringify({ records }),
    });
    const resJson = await res.json();
    if (res.ok) {
      logger.success("Batch records imported successfully on backend API.", resJson);
      return {
        createdCount: toCount(resJson.created_count),
        updatedCount: toCount(resJson.updated_count),
        unchangedCount: toCount(resJson.unchanged_count),
        failedCount: toCount(resJson.failed_count),
        errors: normalizeBatchErrors(resJson.errors),
      };
    } else {
      const errMsg =
        typeof resJson.detail === "string"
          ? resJson.detail
          : resJson.error || resJson.message || "Batch record ingestion failed";
      return {
        createdCount: 0,
        updatedCount: 0,
        unchangedCount: 0,
        failedCount: 0,
        errors: [],
        error: errMsg,
      };
    }
  } catch (err: any) {
    logger.error("Network error batch importing collection records:", err);
    return {
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      failedCount: 0,
      errors: [],
      error: err?.message || "Network error batch importing collection records",
    };
  }
}

export async function updateCollectionRecordApi(
  collectionId: string,
  recordId: string,
  data: Record<string, any>
): Promise<{ record?: CollectionRecord; error?: string }> {
  const selectedProjId = resolveProjectId();
  if (!selectedProjId) {
    return { error: "Select a website before updating a record." };
  }
  logger.info(`Updating record ${recordId} for collection ${collectionId}`, data);
  try {
    const res = await apiFetch(`${API_BASE_URL}/collections/${collectionId}/records/${recordId}`, {
      method: "PUT",
      headers: getCollectionHeaders(selectedProjId),
      body: JSON.stringify({ data }),
    });
    const resJson = await res.json();
    if (res.ok) {
      logger.success("Record updated successfully on backend API.", resJson);
      return { record: normalizeCollectionRecord(resJson.data || resJson) || undefined };
    } else {
      const errMsg =
        typeof resJson.detail === "string"
          ? resJson.detail
          : resJson.error || resJson.message || "Record validation failed";
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error updating collection record:", err);
    return { error: err?.message || "Network error updating collection record" };
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
      `${API_BASE_URL}/collections/${collectionId}/records/${recordId}`,
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
