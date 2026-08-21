import { APP_CONFIG } from "@/config/app.config";
import { getAuthHeaders } from "./auth.api";
import { logger } from "@/utils/logger";
import {
  CollectionSchema,
  CollectionRecord,
  CreateCollectionPayload,
  CreateRecordPayload,
} from "@/models/collection.model";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

// Fallback in-memory state for offline/demo operation
const MOCK_COLLECTIONS: CollectionSchema[] = [
  {
    id: "col_articles_01",
    tenant_id: "ten_default",
    name: "Blog Articles",
    slug: "blog-articles",
    schema_definition: [
      { name: "title", label: "Article Title", type: "string", validation: { required: true } },
      { name: "author", label: "Author Name", type: "string", validation: { required: true } },
      { name: "read_time_mins", label: "Read Time (mins)", type: "number", validation: { required: false } },
      { name: "is_published", label: "Published", type: "boolean", validation: { required: true } },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "col_inventory_02",
    tenant_id: "ten_default",
    name: "Store Inventory",
    slug: "store-inventory",
    schema_definition: [
      { name: "product_sku", label: "Product SKU", type: "string", validation: { required: true, unique: true } },
      { name: "price", label: "Unit Price ($)", type: "number", validation: { required: true } },
      { name: "stock_quantity", label: "Stock Quantity", type: "number", validation: { required: true } },
      { name: "in_stock", label: "In Stock", type: "boolean", validation: { required: true } },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const MOCK_RECORDS: Record<string, CollectionRecord[]> = {
  col_articles_01: [
    {
      id: "rec_art_101",
      tenant_id: "ten_default",
      collection_id: "col_articles_01",
      data: {
        title: "Building Modern Headless Architecture with Next.js 14 & FastAPI",
        author: "Alex Morgan",
        read_time_mins: 8,
        is_published: true,
      },
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: "rec_art_102",
      tenant_id: "ten_default",
      collection_id: "col_articles_01",
      data: {
        title: "Metadata-Driven JSONB Patterns in PostgreSQL",
        author: "Sourabh Pujari",
        read_time_mins: 12,
        is_published: true,
      },
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
  col_inventory_02: [
    {
      id: "rec_inv_201",
      tenant_id: "ten_default",
      collection_id: "col_inventory_02",
      data: {
        product_sku: "OLIO-PROD-001",
        price: 199.99,
        stock_quantity: 45,
        in_stock: true,
      },
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ],
};

export async function fetchCollectionsApi(projectId?: string): Promise<CollectionSchema[]> {
  const selectedProjId =
    projectId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("selected_project_id") || sessionStorage.getItem("selected_project_id")
      : null);

  logger.info(`Fetching collection schemas for project ${selectedProjId || "all"}...`);
  try {
    const url = selectedProjId
      ? `${API_BASE_URL}/collections?project_id=${selectedProjId}`
      : `${API_BASE_URL}/collections`;
    const res = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const json = await res.json();
      const items = json.data || json.items || json;
      if (Array.isArray(items)) {
        logger.success(`Fetched ${items.length} collection schemas from API.`);
        return items;
      }
    }
  } catch (err) {
    logger.warn("Using offline fallback collections due to network issue:", err);
  }

  if (selectedProjId) {
    return MOCK_COLLECTIONS.filter(
      (c) => !c.project_id || c.project_id === selectedProjId || c.project_id === "proj_default"
    );
  }
  return MOCK_COLLECTIONS;
}

export async function fetchCollectionSchemaApi(
  collectionId: string
): Promise<CollectionSchema | null> {
  logger.info(`Fetching collection schema details for ID: ${collectionId}`);
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    logger.warn(`Failed to fetch collection schema ${collectionId} from API:`, err);
  }
  return MOCK_COLLECTIONS.find((c) => c.id === collectionId) || null;
}

export async function createCollectionSchemaApi(
  payload: CreateCollectionPayload
): Promise<{ collection?: CollectionSchema; error?: string }> {
  const selectedProjId =
    typeof window !== "undefined"
      ? localStorage.getItem("selected_project_id") || sessionStorage.getItem("selected_project_id")
      : null;
  const fullPayload = {
    ...payload,
    project_id: payload.project_id || selectedProjId || undefined,
  };

  logger.info("Creating collection schema...", fullPayload);
  try {
    const res = await fetch(`${API_BASE_URL}/collections`, {
      method: "POST",
      headers: getAuthHeaders(),
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
    logger.warn("Offline creating mock collection schema:", err);
    const newCol: CollectionSchema = {
      id: `col_${Date.now()}`,
      tenant_id: "ten_default",
      project_id: fullPayload.project_id || "proj_default",
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, "-"),
      schema_definition: payload.schema_definition,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    MOCK_COLLECTIONS.unshift(newCol);
    return { collection: newCol };
  }
}

export async function updateCollectionSchemaApi(
  collectionId: string,
  payload: { name?: string; icon?: string; featured_image?: string; api_id_singular?: string; api_id_plural?: string; schema_definition?: any[] }
): Promise<{ collection?: CollectionSchema; error?: string }> {
  logger.info(`Updating collection schema ID: ${collectionId}...`, payload);
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
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
    logger.warn("Offline updating mock collection schema:", err);
    const col = MOCK_COLLECTIONS.find((c) => c.id === collectionId);
    if (col) {
      if (payload.name) col.name = payload.name;
      if (payload.schema_definition) col.schema_definition = payload.schema_definition;
      return { collection: col };
    }
    return { error: "Collection schema not found" };
  }
}

export async function deleteCollectionSchemaApi(
  collectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok || res.status === 204) {
      return { success: true };
    }
    const data = await res.json().catch(() => ({}));
    return { success: false, error: data.error || data.detail || "Failed to delete schema" };
  } catch (err: any) {
    const idx = MOCK_COLLECTIONS.findIndex((c) => c.id === collectionId);
    if (idx !== -1) MOCK_COLLECTIONS.splice(idx, 1);
    return { success: true };
  }
}

export async function fetchCollectionRecordsApi(
  collectionId: string,
  filters?: Record<string, string>
): Promise<CollectionRecord[]> {
  logger.info(`Fetching records for collection ${collectionId}...`, filters);
  try {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== "") queryParams.append(k, v);
      });
    }
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/records?${queryParams}`, {
      headers: getAuthHeaders(),
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
    logger.warn("Using fallback offline collection records:", err);
  }
  return MOCK_RECORDS[collectionId] || [];
}

export async function createCollectionRecordApi(
  collectionId: string,
  data: Record<string, any>
): Promise<{ record?: CollectionRecord; error?: string }> {
  logger.info(`Ingesting record for collection ${collectionId}`, data);
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/records`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ data }),
    });
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
    logger.warn("Offline creating mock collection record:", err);
    const newRec: CollectionRecord = {
      id: `rec_${Date.now()}`,
      tenant_id: "ten_default",
      collection_id: collectionId,
      data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!MOCK_RECORDS[collectionId]) MOCK_RECORDS[collectionId] = [];
    MOCK_RECORDS[collectionId].unshift(newRec);
    return { record: newRec };
  }
}

export async function deleteCollectionRecordApi(
  collectionId: string,
  recordId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/collections/${collectionId}/records/${recordId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok || res.status === 204) {
      return { success: true };
    }
  } catch (err) {
    // Offline fallback delete
    if (MOCK_RECORDS[collectionId]) {
      MOCK_RECORDS[collectionId] = MOCK_RECORDS[collectionId].filter((r) => r.id !== recordId);
    }
  }
  return { success: true };
}
