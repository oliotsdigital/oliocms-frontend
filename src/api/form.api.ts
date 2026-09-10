import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCollectionHeaders, getSelectedProjectId } from "./client";
import { logger } from "@/utils/logger";
import {
  FormSchema,
  FormField,
  FormRecord,
  FormRecordsPage,
  FetchFormRecordsOptions,
  CreateFormPayload,
  UpdateFormPayload,
} from "@/models/form.model";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

export const FORMS_LIST_MAX_LIMIT = 200;
export const FORM_RECORDS_DEFAULT_LIMIT = 50;
export const FORM_RECORDS_MAX_LIMIT = 200;

function formApiError(errorData: any, fallback: string): Error {
  const msg =
    (typeof errorData?.error === "string" && errorData.error) ||
    (typeof errorData?.detail === "string" && errorData.detail) ||
    (typeof errorData?.message === "string" && errorData.message) ||
    fallback;
  const err = new Error(msg) as Error & { code?: string };
  if (typeof errorData?.code === "string") err.code = errorData.code;
  return err;
}

function isBlankValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/** Build a POST /forms/{id}/records payload using field name or id only. Extra keys are omitted. */
export function buildFormSubmissionData(
  fields: FormField[],
  values: Record<string, any>
): Record<string, any> {
  const data: Record<string, any> = {};

  fields.forEach((field) => {
    const key = field.name || field.id;
    if (!key) return;

    const raw = values[field.name] ?? values[field.id];
    if (field.type === "checkbox") {
      data[key] = Boolean(raw);
      return;
    }
    if (isBlankValue(raw)) return;
    data[key] = typeof raw === "string" ? raw.trim() : raw;
  });

  return data;
}

function resolveProjectId(projectId?: string): string | null {
  return projectId || getSelectedProjectId();
}

export function normalizeForm(raw: any): FormSchema {
  return {
    id: String(raw.id),
    tenant_id: raw.tenant_id || raw.tenantId || "",
    project_id: raw.project_id || raw.projectId || "",
    name: raw.name || "Untitled Form",
    slug: raw.slug || "",
    description: raw.description || null,
    fields: Array.isArray(raw.fields) ? raw.fields : [],
    settings: {
      submit_button_text: raw.settings?.submit_button_text || "Submit",
      success_message: raw.settings?.success_message || "Thank you! Your response has been recorded.",
      redirect_url: raw.settings?.redirect_url || "",
      notification_email: raw.settings?.notification_email || "",
      is_active: raw.settings?.is_active !== false,
    },
    created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.updatedAt || new Date().toISOString(),
  };
}

/**
 * Fetch all forms for the current project.
 */
export async function fetchFormsApi(projectId?: string): Promise<FormSchema[]> {
  const selectedProjId = resolveProjectId(projectId);
  if (!selectedProjId) {
    logger.info("Skipping forms fetch; no project selected.");
    return [];
  }

  logger.info(`Fetching forms for project ${selectedProjId}...`);
  try {
    const collected: FormSchema[] = [];
    let offset = 0;

    while (offset < FORMS_LIST_MAX_LIMIT * 20) {
      const params = new URLSearchParams({
        project_id: selectedProjId,
        limit: String(FORMS_LIST_MAX_LIMIT),
        offset: String(offset),
      });
      const res = await apiFetch(`${API_BASE_URL}/forms?${params.toString()}`, {
        headers: getCollectionHeaders(selectedProjId),
      });

      if (!res.ok) {
        logger.warn(`Failed to fetch forms: ${res.status} ${res.statusText}`);
        break;
      }

      const data = await res.json();
      const page = Array.isArray(data) ? data.map(normalizeForm) : [];
      collected.push(...page);
      if (page.length < FORMS_LIST_MAX_LIMIT) break;
      offset += FORMS_LIST_MAX_LIMIT;
    }

    logger.success(`Fetched ${collected.length} forms from API.`);
    return collected;
  } catch (err) {
    logger.error("Error fetching forms from API:", err);
  }

  return [];
}

/**
 * Fetch a single form by ID.
 */
export async function fetchFormByIdApi(formId: string, projectId?: string): Promise<FormSchema | null> {
  const selectedProjId = resolveProjectId(projectId);
  try {
    const res = await apiFetch(`${API_BASE_URL}/forms/${formId}`, {
      headers: getCollectionHeaders(selectedProjId || undefined),
    });

    if (res.ok) {
      const data = await res.json();
      return normalizeForm(data);
    }
  } catch (err) {
    logger.error(`Error fetching form ${formId}:`, err);
  }
  return null;
}

/**
 * Create a new form via private REST API.
 */
export async function createFormApi(payload: CreateFormPayload): Promise<FormSchema> {
  const selectedProjId = resolveProjectId(payload.project_id);
  const body = {
    ...payload,
    project_id: selectedProjId,
  };

  const res = await apiFetch(`${API_BASE_URL}/forms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCollectionHeaders(selectedProjId || undefined),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create form: ${res.statusText}`);
  }

  const data = await res.json();
  return normalizeForm(data);
}

/**
 * Update an existing form and its fields.
 */
export async function updateFormApi(formId: string, payload: UpdateFormPayload, projectId?: string): Promise<FormSchema> {
  const selectedProjId = resolveProjectId(projectId);

  const res = await apiFetch(`${API_BASE_URL}/forms/${formId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getCollectionHeaders(selectedProjId || undefined),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update form: ${res.statusText}`);
  }

  const data = await res.json();
  return normalizeForm(data);
}

/**
 * Soft delete a form.
 */
export async function deleteFormApi(formId: string, projectId?: string): Promise<void> {
  const selectedProjId = resolveProjectId(projectId);

  const res = await apiFetch(`${API_BASE_URL}/forms/${formId}`, {
    method: "DELETE",
    headers: getCollectionHeaders(selectedProjId || undefined),
  });

  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete form: ${res.statusText}`);
  }
}

/**
 * Fetch submitted records for a form.
 */
export async function fetchFormRecordsApi(
  formId: string,
  projectId?: string,
  options: FetchFormRecordsOptions = {}
): Promise<FormRecordsPage> {
  const selectedProjId = resolveProjectId(projectId);
  const skip = Math.max(0, options.skip ?? 0);
  const limit = Math.min(
    FORM_RECORDS_MAX_LIMIT,
    Math.max(1, options.limit ?? FORM_RECORDS_DEFAULT_LIMIT)
  );
  const empty: FormRecordsPage = { data: [], total: 0, skip, limit };

  try {
    const params = new URLSearchParams({
      skip: String(skip),
      limit: String(limit),
    });
    const res = await apiFetch(`${API_BASE_URL}/forms/${formId}/records?${params.toString()}`, {
      headers: getCollectionHeaders(selectedProjId || undefined),
      signal: options.signal,
    });

    if (res.ok) {
      const data = await res.json();
      return {
        data: Array.isArray(data.data) ? data.data : [],
        total: typeof data.total === "number" ? data.total : 0,
        skip: typeof data.skip === "number" ? data.skip : skip,
        limit: typeof data.limit === "number" ? data.limit : limit,
      };
    }
  } catch (err) {
    if (options.signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      throw err;
    }
    logger.error(`Error fetching records for form ${formId}:`, err);
  }
  return empty;
}

/**
 * Submit a record to a form.
 */
export async function createFormRecordApi(
  formId: string,
  recordData: Record<string, any>,
  projectId?: string
): Promise<FormRecord> {
  const selectedProjId = resolveProjectId(projectId);

  const res = await apiFetch(`${API_BASE_URL}/forms/${formId}/records`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getCollectionHeaders(selectedProjId || undefined),
    },
    body: JSON.stringify({ data: recordData }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw formApiError(errorData, "Failed to submit form record");
  }

  return res.json();
}

/**
 * Delete a form submission record.
 */
export async function deleteFormRecordApi(
  formId: string,
  recordId: string,
  projectId?: string
): Promise<void> {
  const selectedProjId = resolveProjectId(projectId);

  const res = await apiFetch(`${API_BASE_URL}/forms/${formId}/records/${recordId}`, {
    method: "DELETE",
    headers: getCollectionHeaders(selectedProjId || undefined),
  });

  if (!res.ok && res.status !== 204) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete form record: ${res.statusText}`);
  }
}

