"use client";

import React from "react";

interface HeaderProps {
  title: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isDarkMode,
  onToggleTheme,
  searchQuery = "",
  onSearchChange,
}) => {
  return (
    <div className="hidden md:flex items-center justify-between mb-8 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your headless content ecosystem seamlessly.
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Search anything..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Dark / Light Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-xl glass-card flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-500 transition shadow-sm"
          title="Toggle Theme"
        >
          <i
            className={`fa-solid text-sm ${
              isDarkMode ? "fa-sun text-amber-400" : "fa-moon text-slate-600"
            }`}
          ></i>
        </button>
      </div>
    </div>
  );
};
