"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOlio } from "@/state/OlioProvider";
import { LoginFormCard } from "@/components/auth/LoginFormCard";
import { ToastContainer } from "@/components/layout/ToastContainer";

export default function LoginPage() {
  const router = useRouter();
  const { auth, theme, toast } = useOlio();

  useEffect(() => {
    if (auth.isLoggedIn) {
      router.push("/dashboard");
    }
  }, [auth.isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await auth.handleLogin();
    if (success) {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <ToastContainer toasts={toast.toasts} />
      <div className="w-full max-w-md">
        <LoginFormCard
          authForm={auth.authForm}
          isDarkMode={theme.isDarkMode}
          onFormChange={auth.updateAuthForm}
          onSubmit={handleSubmit}
          onToggleTheme={theme.toggleTheme}
          onSwitchToRegister={() => router.push("/register")}
          onForgotPassword={() => toast.showToast("Password reset link sent to your email", "info")}
        />
      </div>
    </div>
  );
}
