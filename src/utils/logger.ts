/**
 * Frontend Logger Utility with User & Tenant Context.
 */

function getUserContext(): string {
  if (typeof window === "undefined") return "[User: Server/SSG]";

  let email = "Anonymous";
  let userId = "";
  const tenantId = localStorage.getItem("tenant_id") || "";

  try {
    const authStorage = localStorage.getItem("olio_auth_storage");
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      if (parsed?.state?.user) {
        email = parsed.state.user.email || email;
        userId = parsed.state.user.id || userId;
      }
    }
  } catch (_) {}

  const userStr = userId ? `${email} (${userId})` : email;
  const tenantStr = tenantId ? ` | Tenant: ${tenantId}` : "";
  return `[User: ${userStr}${tenantStr}]`;
}

export const logger = {
  info: (message: string, ...args: any[]) => {
    const ctx = getUserContext();
    console.log(
      `%c[OlioCMS ${new Date().toLocaleTimeString()}] ${ctx} - ${message}`,
      "color: #3b82f6; font-weight: bold;",
      ...args
    );
  },
  success: (message: string, ...args: any[]) => {
    const ctx = getUserContext();
    console.log(
      `%c[OlioCMS ${new Date().toLocaleTimeString()}] ${ctx} - ${message}`,
      "color: #10b981; font-weight: bold;",
      ...args
    );
  },
  warn: (message: string, ...args: any[]) => {
    const ctx = getUserContext();
    console.warn(
      `[OlioCMS ${new Date().toLocaleTimeString()}] ${ctx} - ${message}`,
      ...args
    );
  },
  error: (message: string, ...args: any[]) => {
    const ctx = getUserContext();
    console.error(
      `[OlioCMS ${new Date().toLocaleTimeString()}] ${ctx} - ${message}`,
      ...args
    );
  },
};
