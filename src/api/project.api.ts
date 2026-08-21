import { Project, NewProjectForm } from "@/models/project.model";
import { APP_CONFIG } from "@/config/app.config";
import { getAuthHeaders } from "./auth.api";
import { logger } from "@/utils/logger";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

export const DEFAULT_PROJECTS: Project[] = [];

export async function fetchProjectsApi(): Promise<{ projects: Project[]; success: boolean }> {
  logger.info("Fetching projects list from API...");
  try {
    const res = await fetch(`${API_BASE_URL}/projects?limit=100`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      const items = data.data || data.items || data;
      if (Array.isArray(items)) {
        logger.success(`Fetched ${items.length} projects successfully from backend.`);
        return {
          projects: items.map((p: any, idx: number) => ({
            id: String(p.id),
            name: p.name,
            domain: p.domain || undefined,
            defaultDomain: p.default_domain || p.domain || undefined,
            code: p.name.substring(0, 3).toUpperCase(),
            icon: "fa-folder-tree",
            color:
              idx % 3 === 0
                ? "from-blue-500 to-indigo-600"
                : idx % 3 === 1
                ? "from-purple-500 to-pink-500"
                : "from-emerald-500 to-teal-600",
            isDefault: idx === 0,
          })),
          success: true,
        };
      }
    } else {
      logger.warn(`Failed to fetch projects from backend API (Status: ${res.status})`);
    }
  } catch (err) {
    logger.warn("Failed to fetch projects from backend API:", err);
  }
  return { projects: [], success: false };
}


export async function checkDomainAvailabilityApi(
  defaultDomain?: string,
  customDomain?: string
): Promise<{ defaultDomainAvailable: boolean; domainAvailable: boolean }> {
  try {
    const params = new URLSearchParams();
    if (defaultDomain) params.append("default_domain", defaultDomain);
    if (customDomain) params.append("domain", customDomain);

    const res = await fetch(`${API_BASE_URL}/projects/check-domain?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return {
        defaultDomainAvailable: data.default_domain_available ?? true,
        domainAvailable: data.domain_available ?? true,
      };
    }
  } catch (err) {
    logger.warn("Error checking domain availability:", err);
  }
  return { defaultDomainAvailable: true, domainAvailable: true };
}

export async function createProjectApi(
  form: NewProjectForm
): Promise<{ project: Project; error?: string }> {
  logger.info(`Creating new project: "${form.name}"`, { form });
  try {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: form.name,
        domain: form.domain || undefined,
        default_domain: form.defaultDomain || form.domain || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      logger.success(`Project "${form.name}" created successfully on backend API.`, data);
      return {
        project: {
          id: String(data.id),
          name: data.name,
          domain: data.domain || undefined,
          defaultDomain: data.default_domain || data.domain || undefined,
          code: data.name.substring(0, 3).toUpperCase(),
          icon: "fa-folder-plus",
          color: "from-amber-500 to-orange-500",
        },
      };
    } else {
      const errMsg =
        typeof data.detail === "string"
          ? data.detail
          : data.error || data.message || "Server error while creating project";
      logger.warn(`Backend rejected project creation: ${errMsg}`, data);
      return {
        project: {
          id: `proj_${Date.now()}`,
          name: form.name,
          domain: form.domain || undefined,
          defaultDomain: form.defaultDomain || form.domain || undefined,
          code: form.name.substring(0, 3).toUpperCase(),
          icon: "fa-folder-plus",
          color: "from-amber-500 to-orange-500",
        },
        error: errMsg,
      };
    }
  } catch (err: any) {
    logger.error("Network error calling create project API:", err);
    return {
      project: {
        id: `proj_${Date.now()}`,
        name: form.name,
        domain: form.domain || undefined,
        defaultDomain: form.defaultDomain || form.domain || undefined,
        code: form.name.substring(0, 3).toUpperCase(),
        icon: "fa-folder-plus",
        color: "from-amber-500 to-orange-500",
      },
    };
  }
}

export async function updateProjectApi(
  id: string,
  data: { name?: string; domain?: string; defaultDomain?: string }
): Promise<{ project?: Project; error?: string }> {
  logger.info(`Updating project ${id}`, data);
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: data.name,
        domain: data.domain !== undefined ? (data.domain || null) : undefined,
        default_domain: data.defaultDomain !== undefined ? (data.defaultDomain || null) : undefined,
      }),
    });
    const resData = await res.json();
    if (res.ok) {
      logger.success(`Project ${id} updated successfully.`, resData);
      return {
        project: {
          id: String(resData.id),
          name: resData.name,
          domain: resData.domain || undefined,
          defaultDomain: resData.default_domain || resData.domain || undefined,
          code: resData.name.substring(0, 3).toUpperCase(),
          icon: "fa-folder-tree",
          color: "from-blue-500 to-indigo-600",
        },
      };
    } else {
      const errMsg =
        typeof resData.detail === "string"
          ? resData.detail
          : resData.error || resData.message || "Failed to update project";
      logger.warn(`Failed to update project ${id}: ${errMsg}`, resData);
      return { error: errMsg };
    }
  } catch (err: any) {
    logger.error(`Network error updating project ${id}:`, err);
    return { error: err?.message || "Network error updating project" };
  }
}

export async function deleteProjectApi(id: string): Promise<{ success: boolean; error?: string }> {
  logger.info(`Deleting project ${id}...`);
  try {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok || res.status === 204) {
      logger.success(`Project ${id} deleted successfully.`);
      return { success: true };
    } else {
      const data = await res.json().catch(() => ({}));
      const errMsg = data.error || data.detail || "Failed to delete project";
      logger.warn(`Failed to delete project ${id}: ${errMsg}`);
      return { success: false, error: errMsg };
    }
  } catch (err: any) {
    logger.error(`Network error deleting project ${id}:`, err);
    return { success: false, error: err?.message || "Network error deleting project" };
  }
}
