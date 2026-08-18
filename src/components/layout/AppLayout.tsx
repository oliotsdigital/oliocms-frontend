"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOlio } from "@/state/OlioProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { ToastContainer } from "./ToastContainer";

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  pageTitle,
  searchQuery,
  onSearchChange,
}) => {
  const router = useRouter();
  const { auth, theme, toast } = useOlio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!auth.isLoggedIn) {
      router.push("/login");
    }
  }, [auth.isLoggedIn, router]);

  if (!auth.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-brand-500 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
      <ToastContainer toasts={toast.toasts} />

      <Sidebar user={auth.user} onLogout={auth.handleLogout} />
      <MobileHeader
        isDarkMode={theme.isDarkMode}
        onToggleTheme={theme.toggleTheme}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={auth.handleLogout}
      />

      <main className="flex-1 md:ml-16 transition-all duration-300 p-4 md:p-8 overflow-y-auto min-h-screen">
        <Header
          title={pageTitle}
          isDarkMode={theme.isDarkMode}
          onToggleTheme={theme.toggleTheme}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
        {children}
      </main>
    </div>
  );
};
