"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOlio } from "@/state/OlioProvider";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileHeader } from "./MobileHeader";
import { MobileDrawer } from "./MobileDrawer";
import { ToastContainer } from "./ToastContainer";
import { FirstWebsiteModal } from "./FirstWebsiteModal";

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
  const { auth, theme, toast, projectState } = useOlio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!auth.isInitializing && !auth.isLoggedIn) {
      router.push("/login");
    }
  }, [auth.isInitializing, auth.isLoggedIn, router]);

  if (auth.isInitializing || !auth.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-xl bg-brand-500 animate-spin"></div>
      </div>
    );
  }


  // Force First Website Modal ONLY if projects finish loading and user genuinely has 0 websites in the database
  const showFirstWebsiteModal = !projectState.isLoading && projectState.isFirstTimeUser;


  return (
    <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
      <ToastContainer toasts={toast.toasts} />

      {/* Mandatory First Website Setup Modal for first-time users */}
      {showFirstWebsiteModal && <FirstWebsiteModal onLogout={auth.handleLogout} />}

      <Sidebar
        user={auth.user}
        onLogout={auth.handleLogout}
        isFirstWebsiteModalOpen={showFirstWebsiteModal}
      />
      <MobileHeader
        isDarkMode={theme.isDarkMode}
        onToggleTheme={theme.toggleTheme}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={auth.handleLogout}
        isFirstWebsiteModalOpen={showFirstWebsiteModal}
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
