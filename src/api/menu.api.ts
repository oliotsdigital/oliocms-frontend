import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { logger } from "@/utils/logger";
import { MenuSchema, MenuItem, MenuLocations } from "@/models/menu.model";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

function resolveProjectId(projectId?: string): string | null {
  return projectId || getSelectedProjectId();
}

export function normalizeMenu(raw: any): MenuSchema {
  return {
    id: String(raw.id),
    tenantId: raw.tenant_id || raw.tenantId,
    projectId: raw.project_id || raw.projectId,
    name: raw.name || "Untitled Menu",
    slug: raw.slug || "",
    autoAddPages: Boolean(raw.auto_add_pages ?? raw.autoAddPages),
    locations: {
      primary: Boolean(raw.locations?.primary),
      footer: Boolean(raw.locations?.footer),
      mobile: Boolean(raw.locations?.mobile),
      topbar: Boolean(raw.locations?.topbar),
    },
    items: Array.isArray(raw.items) ? raw.items : [],
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Fetch all navigation menus for the project.
 */
export async function fetchMenusApi(projectId?: string): Promise<MenuSchema[]> {
  const selectedProjId = resolveProjectId(projectId);
  if (!selectedProjId) {
    logger.info("Skipping menus fetch; no project selected.");
    return [];
  }

  logger.info(`Fetching menus for project ${selectedProjId}...`);
  try {
    const res = await apiFetch(`${API_BASE_URL}/menus`, {
      headers: getCollectionHeaders(selectedProjId),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        logger.success(`Fetched ${data.length} menus from API.`);
        return data.map(normalizeMenu);
      }
    } else {
      logger.warn(`Failed to fetch menus: ${res.status} ${res.statusText}`);
    }
  } catch (err) {
    logger.error("Error fetching menus from API:", err);
  }

  return [];
}

/**
 * Create a new navigation menu.
 */
export async function createMenuApi(payload: {
  name: string;
  slug?: string;
  autoAddPages?: boolean;
  locations?: MenuLocations;
  items?: MenuItem[];
  projectId?: string;
}): Promise<MenuSchema> {
  const selectedProjId = resolveProjectId(payload.projectId);
  if (!selectedProjId) {
    throw new Error("Cannot create menu: Project ID is required.");
  }

  const backendPayload = {
    name: payload.name.trim(),
    slug: payload.slug?.trim() || undefined,
    auto_add_pages: payload.autoAddPages ?? false,
    locations: payload.locations ?? {
      primary: false,
      footer: false,
      mobile: false,
      topbar: false,
    },
    items: payload.items ?? [],
    project_id: selectedProjId,
  };

  const res = await apiFetch(`${API_BASE_URL}/menus`, {
    method: "POST",
    headers: {
      ...getCollectionHeaders(selectedProjId),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendPayload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.message || errorBody?.detail || `Failed to create menu (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return normalizeMenu(data);
}

/**
 * Update an existing navigation menu (name, slug, locations, items).
 */
export async function updateMenuApi(
  menuId: string,
  payload: {
    name?: string;
    slug?: string;
    autoAddPages?: boolean;
    locations?: MenuLocations;
    items?: MenuItem[];
    projectId?: string;
  }
): Promise<MenuSchema> {
  const selectedProjId = resolveProjectId(payload.projectId);

  const backendPayload: Record<string, any> = {};
  if (payload.name !== undefined) backendPayload.name = payload.name.trim();
  if (payload.slug !== undefined) backendPayload.slug = payload.slug.trim();
  if (payload.autoAddPages !== undefined) backendPayload.auto_add_pages = payload.autoAddPages;
  if (payload.locations !== undefined) backendPayload.locations = payload.locations;
  if (payload.items !== undefined) backendPayload.items = payload.items;

  const res = await apiFetch(`${API_BASE_URL}/menus/${menuId}`, {
    method: "PUT",
    headers: {
      ...getCollectionHeaders(selectedProjId || undefined),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(backendPayload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.message || errorBody?.detail || `Failed to save menu (${res.status})`;
    throw new Error(message);
  }

  const data = await res.json();
  return normalizeMenu(data);
}

/**
 * Soft delete a navigation menu.
 */
export async function deleteMenuApi(menuId: string, projectId?: string): Promise<boolean> {
  const selectedProjId = resolveProjectId(projectId);

  const res = await apiFetch(`${API_BASE_URL}/menus/${menuId}`, {
    method: "DELETE",
    headers: getCollectionHeaders(selectedProjId || undefined),
  });

  return res.ok;
}

/**
 * Fetch a single navigation menu by ID.
 */
export async function fetchMenuByIdApi(
  menuId: string,
  projectId?: string
): Promise<MenuSchema | null> {
  const selectedProjId = resolveProjectId(projectId);
  try {
    const res = await apiFetch(`${API_BASE_URL}/menus/${menuId}`, {
      headers: getCollectionHeaders(selectedProjId || undefined),
    });
    if (res.ok) {
      const data = await res.json();
      return normalizeMenu(data);
    }
  } catch (err) {
    logger.warn(`Failed to fetch menu ${menuId} from API:`, err);
  }
  return null;
}
