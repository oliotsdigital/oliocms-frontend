import { UserProfile } from "@/models/profile.model";
import { APP_CONFIG } from "@/config/app.config";
import { apiFetch, getCmsHeaders } from "./client";
import { logger } from "@/utils/logger";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  role: "",
  avatar: "",
  apiKey: "",
};

function mapUserToProfile(data: Record<string, any>): UserProfile {
  return {
    name: data.full_name || data.name || "",
    email: data.email || "",
    role: data.role || data.tenants?.[0]?.role || "",
    avatar: data.avatar || "",
    apiKey: data.api_key || "",
  };
}

export async function fetchProfileApi(): Promise<UserProfile> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/users/me`, {
      headers: getCmsHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return mapUserToProfile(data.data || data);
    }
    logger.warn(`Failed to fetch /users/me (Status: ${res.status})`);
  } catch (err) {
    logger.warn("Failed to fetch current user profile:", err);
  }
  return { ...EMPTY_PROFILE };
}

export async function updateProfileApi(updated: Partial<UserProfile>): Promise<UserProfile> {
  return {
    ...EMPTY_PROFILE,
    ...updated,
  };
}
