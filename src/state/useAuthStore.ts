"use client";

import { useState, useEffect } from "react";
import { AuthForm, UserSession } from "@/models/auth.model";
import { loginApi, registerApi, logoutApi } from "@/api/auth.api";

export function useAuthStore(showToast?: (msg: string, type?: "success" | "info" | "error") => void) {
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [authForm, setAuthForm] = useState<AuthForm>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Restore stored session on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("supabase_access_token") ||
        sessionStorage.getItem("supabase_access_token");
      const tenantId =
        localStorage.getItem("tenant_id") ||
        sessionStorage.getItem("tenant_id");
      const savedUserStr =
        localStorage.getItem("olio_user_session") ||
        sessionStorage.getItem("olio_user_session");

      if (token && tenantId) {
        setIsLoggedIn(true);
        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch (e) {
            // ignore
          }
        }
      }
      setIsInitializing(false);
    }
  }, []);

  const updateAuthForm = (fields: Partial<AuthForm>) => {
    setAuthForm((prev) => ({ ...prev, ...fields }));
  };

  const handleLogin = async (): Promise<boolean> => {
    if (isLoading) return false;
    setIsLoading(true);
    try {
      const res = await loginApi(authForm);
      if (res.success && res.user) {
        setIsLoggedIn(true);
        setUser(res.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("olio_user_session", JSON.stringify(res.user));
          sessionStorage.setItem("olio_user_session", JSON.stringify(res.user));
        }
        if (showToast) showToast(res.message || "Signed in successfully!", "success");
        return true;
      } else {
        if (showToast) showToast(res.message || "Login failed", "error");
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (): Promise<boolean> => {
    if (isLoading) return false;
    if (authForm.password !== authForm.confirmPassword) {
      if (showToast) showToast("Passwords do not match!", "error");
      return false;
    }
    setIsLoading(true);
    try {
      const res = await registerApi(authForm);
      if (res.success) {
        if (res.user) {
          setIsLoggedIn(true);
          setUser(res.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("olio_user_session", JSON.stringify(res.user));
            sessionStorage.setItem("olio_user_session", JSON.stringify(res.user));
          }
          if (showToast) showToast(res.message || "Account registered successfully!", "success");
        } else {
          setIsLoggedIn(false);
          setUser(null);
          if (showToast) showToast(
            res.message || "Registration successful! Please check your email inbox to confirm your account before logging in.",
            "success"
          );
        }
        return true;
      } else {
        if (showToast) showToast(res.message || "Registration failed", "error");
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutApi();
      setIsLoggedIn(false);
      setUser(null);
      setAuthView("login");
      if (typeof window !== "undefined") {
        localStorage.removeItem("olio_user_session");
        sessionStorage.removeItem("olio_user_session");
        localStorage.removeItem("supabase_access_token");
        sessionStorage.removeItem("supabase_access_token");
        localStorage.removeItem("supabase_refresh_token");
        sessionStorage.removeItem("supabase_refresh_token");
        localStorage.removeItem("tenant_id");
        sessionStorage.removeItem("tenant_id");
        localStorage.removeItem("selected_project_id");
        sessionStorage.removeItem("selected_project_id");
      }
      if (showToast) showToast("Logged out of OlioCMS", "info");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isInitializing,
    isLoggedIn,
    authView,
    setAuthView,
    user,
    authForm,
    isLoading,
    updateAuthForm,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}

