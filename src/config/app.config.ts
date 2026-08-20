/**
 * Frontend Application Configuration loaded from environment variables.
 */
export const APP_CONFIG = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  appName: "OlioCMS",
};
