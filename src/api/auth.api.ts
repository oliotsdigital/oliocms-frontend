import { AuthForm, AuthResponse, UserSession } from "@/models/auth.model";
import { APP_CONFIG } from "@/config/app.config";
import { logger } from "@/utils/logger";
import { apiFetch, getPublicHeaders, getBearerHeaders } from "./client";

const API_BASE_URL = APP_CONFIG.apiBaseUrl;

export async function loginApi(form: AuthForm): Promise<AuthResponse> {
  if (!form.email || !form.password) {
    logger.warn("Login attempt rejected: Missing email or password.");
    return { success: false, message: "Email and password are required" };
  }

  logger.info(`Attempting login for user: ${form.email}`);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error || data.detail || "Authentication failed";
      logger.warn(`Login failed for ${form.email}: ${errMsg}`);
      return {
        success: false,
        message: errMsg,
      };
    }

    const tenantId = data.tenant_id || data.user?.tenant_id;

    if (typeof window !== "undefined") {
      if (data.access_token) {
        localStorage.setItem("supabase_access_token", data.access_token);
        sessionStorage.setItem("supabase_access_token", data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem("supabase_refresh_token", data.refresh_token);
        sessionStorage.setItem("supabase_refresh_token", data.refresh_token);
      }
      if (tenantId) {
        localStorage.setItem("tenant_id", tenantId);
        sessionStorage.setItem("tenant_id", tenantId);
      }
    }

    const user: UserSession = {
      id: data.user?.id || "usr_101",
      name: data.user?.full_name || form.email.split("@")[0],
      email: data.user?.email || form.email,
      role: data.user?.tenants?.[0]?.role || "Admin",
      avatar: data.user?.avatar || "",
      apiKey: data.access_token || "",
    };

    logger.success(`User signed in successfully: ${user.email} (${user.id}) | Tenant: ${tenantId}`);

    return {
      success: true,
      user,
      message: "Signed in successfully!",
    };
  } catch (error: any) {
    logger.error("Network error during login request:", error);
    return {
      success: false,
      message: error?.message || "Network error. Unable to reach authentication server.",
    };
  }
}

export async function registerApi(form: AuthForm): Promise<AuthResponse> {
  if (form.confirmPassword && form.password !== form.confirmPassword) {
    logger.warn("Registration rejected: Passwords do not match.");
    return { success: false, message: "Passwords do not match!" };
  }

  logger.info(`Attempting user registration for: ${form.email}`);

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data.error || data.detail || "Registration failed";
      logger.warn(`Registration failed for ${form.email}: ${errMsg}`);
      return {
        success: false,
        message: errMsg,
      };
    }

    const sessionData = data.session;
    const tenantId = data.user?.tenant_id || sessionData?.tenant_id || sessionData?.user?.tenant_id;

    if (typeof window !== "undefined" && sessionData?.access_token) {
      localStorage.setItem("supabase_access_token", sessionData.access_token);
      sessionStorage.setItem("supabase_access_token", sessionData.access_token);
      if (sessionData?.refresh_token) {
        localStorage.setItem("supabase_refresh_token", sessionData.refresh_token);
        sessionStorage.setItem("supabase_refresh_token", sessionData.refresh_token);
      }
      if (tenantId) {
        localStorage.setItem("tenant_id", tenantId);
        sessionStorage.setItem("tenant_id", tenantId);
      }
    }

    const userObj = data.user || sessionData?.user;
    const user: UserSession = {
      id: userObj?.id || "usr_101",
      name: userObj?.full_name || form.email.split("@")[0],
      email: userObj?.email || form.email,
      role: userObj?.tenants?.[0]?.role || "Admin",
      avatar: userObj?.avatar || "",
      apiKey: sessionData?.access_token || "",
    };

    logger.success(`Registered new user account: ${user.email} (${user.id}) | Tenant: ${tenantId}`);

    return {
      success: true,
      user: sessionData?.access_token ? user : undefined,
      message: data.message || "Registration successful! Please check your email to confirm your account.",
    };
  } catch (error: any) {
    logger.error("Network error during registration request:", error);
    return {
      success: false,
      message: error?.message || "Network error. Unable to reach authentication server.",
    };
  }
}

export async function logoutApi(): Promise<{ success: boolean }> {
  logger.info("Logging out current session...");
  if (typeof window !== "undefined") {
    const token =
      localStorage.getItem("supabase_access_token") ||
      sessionStorage.getItem("supabase_access_token");
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: getPublicHeaders(),
        });
      } catch (_) {
        // Ignore logout network errors
      }
    }

    // Clear all auth, tokens, tenant, and project keys from localStorage
    localStorage.removeItem("supabase_access_token");
    localStorage.removeItem("supabase_refresh_token");
    localStorage.removeItem("tenant_id");
    localStorage.removeItem("selected_project_id");

    // Clear all keys from sessionStorage
    sessionStorage.removeItem("supabase_access_token");
    sessionStorage.removeItem("supabase_refresh_token");
    sessionStorage.removeItem("tenant_id");
    sessionStorage.removeItem("selected_project_id");
    sessionStorage.clear();
  }
  logger.success("User logged out cleanly and browser session/local storage cleared.");
  return { success: true };
}

export async function changePasswordApi(newPassword: string): Promise<{ success: boolean; message?: string }> {
  logger.info("Requesting password change...");
  try {
    const res = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: getBearerHeaders(),
      body: JSON.stringify({ new_password: newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      logger.success("Password changed successfully.");
      return { success: true, message: data.message || "Password updated successfully!" };
    } else {
      const errMsg = data.error || data.detail || "Failed to update password";
      logger.warn("Password change failed:", errMsg);
      return { success: false, message: errMsg };
    }
  } catch (err: any) {
    logger.error("Network error during password change:", err);
    return { success: false, message: err?.message || "Network error updating password." };
  }
}

