"use client";

import React from "react";
import Link from "next/link";

interface MobileHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isDarkMode,
  onToggleTheme,
  onOpenMobileMenu,
}) => {
  return (
    <header className="md:hidden glass-panel sticky top-0 z-30 px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
          <i className="fa-solid fa-cubes"></i>
        </div>
        <span className="font-bold text-base text-slate-900 dark:text-white">
          Olio<span className="text-brand-500">CMS</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-600 dark:text-slate-300"
        >
          <i
            className={`fa-solid ${
              isDarkMode ? "fa-sun text-amber-400" : "fa-moon text-slate-600"
            }`}
          ></i>
        </button>
        <button
          onClick={onOpenMobileMenu}
          className="w-8 h-8 rounded-lg glass-card flex items-center justify-center text-slate-600 dark:text-slate-300"
        >
          <i className="fa-solid fa-bars text-sm"></i>
        </button>
      </div>
    </header>
  );
};
