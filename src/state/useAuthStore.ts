"use client";

import { useState } from "react";
import { AuthForm, UserSession } from "@/models/auth.model";
import { loginApi, registerApi, logoutApi } from "@/api/auth.api";

export function useAuthStore(showToast?: (msg: string, type?: "success" | "info" | "error") => void) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [user, setUser] = useState<UserSession | null>(null);

  const [authForm, setAuthForm] = useState<AuthForm>({
    email: "admin@oliocms.io",
    password: "",
    confirmPassword: "",
  });

  const updateAuthForm = (fields: Partial<AuthForm>) => {
    setAuthForm((prev) => ({ ...prev, ...fields }));
  };

  const handleLogin = async () => {
    const res = await loginApi(authForm);
    if (res.success && res.user) {
      setIsLoggedIn(true);
      setUser(res.user);
      if (showToast) showToast(res.message || "Signed in successfully!", "success");
      return true;
    } else {
      if (showToast) showToast(res.message || "Login failed", "error");
      return false;
    }
  };

  const handleRegister = async () => {
    if (authForm.password !== authForm.confirmPassword) {
      if (showToast) showToast("Passwords do not match!", "error");
      return false;
    }
    const res = await registerApi(authForm);
    if (res.success && res.user) {
      setIsLoggedIn(true);
      setUser(res.user);
      if (showToast) showToast(res.message || "Account registered successfully!", "success");
      return true;
    } else {
      if (showToast) showToast(res.message || "Registration failed", "error");
      return false;
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    setIsLoggedIn(false);
    setUser(null);
    setAuthView("login");
    if (showToast) showToast("Logged out of OlioCMS", "info");
  };

  return {
    isLoggedIn,
    authView,
    setAuthView,
    user,
    authForm,
    updateAuthForm,
    handleLogin,
    handleRegister,
    handleLogout,
  };
}
