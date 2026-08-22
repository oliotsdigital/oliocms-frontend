import { APP_CONFIG } from "@/config/app.config";
import { logger } from "@/utils/logger";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

const SESSION_KEYS = [
  "supabase_access_token",
  "supabase_refresh_token",
  "tenant_id",
  "selected_project_id",
  "olio_user_session",
] as const;

const AUTH_SKIP_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/health",
  "/public/",
];

let refreshInFlight: Promise<boolean> | null = null;
let redirectingToLogin = false;

function readStored(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

function writeStored(key: string, value: string): void {
  localStorage.setItem(key, value);
  sessionStorage.setItem(key, value);
}

function clearSession(): void {
  if (typeof window === "undefined") return;
  for (const key of SESSION_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

function shouldSkipAuthHandling(url: string): boolean {
  return AUTH_SKIP_PATHS.some((path) => url.includes(path));
}

function isPublicAuthPage(): boolean {
  const path = window.location.pathname;
  return path === "/login" || path === "/register" || path.startsWith("/login/") || path.startsWith("/register/");
}

function redirectToLogin(): void {
  if (typeof window === "undefined" || redirectingToLogin || isPublicAuthPage()) return;
  redirectingToLogin = true;
  clearSession();
  logger.warn("Access token expired. Redirecting to login.");
  window.location.replace("/login");
}

/** No auth, no tenant — login, register, refresh, logout, health. */
export function getPublicHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

/** Bearer only — change-password, super-admin /tenants. */
export function getBearerHeaders(): Record<string, string> {
  const headers = getPublicHeaders();
  const token = readStored("supabase_access_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function getSelectedProjectId(): string | null {
  return readStored("selected_project_id");
}

/** Bearer + X-Tenant-Id — /projects, /users (including /users/me). */
export function getCmsHeaders(): Record<string, string> {
  const headers = getBearerHeaders();
  const tenantId = readStored("tenant_id");
  if (tenantId) {
    headers["X-Tenant-Id"] = tenantId;
  }
  return headers;
}

/** CMS collections — JWT + X-Tenant-Id + X-Project-Id. */
export function getCollectionHeaders(projectId?: string): Record<string, string> {
  const headers = getCmsHeaders();
  const id = projectId || getSelectedProjectId();
  if (id) {
    headers["X-Project-Id"] = id;
  }
  return headers;
}

/** Storefront public API — X-API-Key + project id, no JWT, no X-Tenant-Id. */
export function getPublicApiHeaders(apiKey: string, projectId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": apiKey,
  };
  const id = projectId || getSelectedProjectId();
  if (id) {
    headers["X-Project-Id"] = id;
  }
  return headers;
}

/** CMS headers for projects/users. */
export function getAuthHeaders(): Record<string, string> {
  return getCmsHeaders();
}

function isExpiredTokenError(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  const code =
    body && typeof body === "object" && "code" in body
      ? String((body as { code?: unknown }).code)
      : "";
  return code === "TOKEN_EXPIRED";
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = readStored("supabase_refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.access_token) {
      return false;
    }
    writeStored("supabase_access_token", data.access_token);
    if (data.refresh_token) {
      writeStored("supabase_refresh_token", data.refresh_token);
    }
    logger.success("Access token refreshed.");
    return true;
  } catch (err) {
    logger.warn("Failed to refresh access token:", err);
    return false;
  }
}

async function ensureFreshToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function withFreshAuthHeader(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers);
  const token = readStored("supabase_access_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}

function requestDedupeKey(input: RequestInfo | URL, init?: RequestInit): string | null {
  const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
  if (method !== "GET") return null;
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  return `${method}:${url}`;
}

const inFlightGets = new Map<string, Promise<Response>>();

async function performApiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const res = await fetch(input, init);

  if (typeof window === "undefined" || shouldSkipAuthHandling(url) || res.status !== 401) {
    return res;
  }

  const body = await res.clone().json().catch(() => null);
  if (!isExpiredTokenError(res.status, body)) {
    return res;
  }

  const refreshed = await ensureFreshToken();
  if (refreshed) {
    const retry = await fetch(input, withFreshAuthHeader(init));
    if (retry.status === 401) {
      const retryBody = await retry.clone().json().catch(() => null);
      if (isExpiredTokenError(retry.status, retryBody)) {
        redirectToLogin();
      }
    }
    return retry;
  }

  redirectToLogin();
  return res;
}

/**
 * fetch wrapper that refreshes an expired access token once, then
 * sends the user back to /login if the session cannot be recovered.
 * Concurrent identical GET requests share one in-flight network call.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const key = requestDedupeKey(input, init);
  if (!key) {
    return performApiFetch(input, init);
  }

  const existing = inFlightGets.get(key);
  if (existing) {
    return existing.then((res) => res.clone());
  }

  const promise = performApiFetch(input, init).finally(() => {
    inFlightGets.delete(key);
  });
  inFlightGets.set(key, promise);
  return promise.then((res) => res.clone());
}
