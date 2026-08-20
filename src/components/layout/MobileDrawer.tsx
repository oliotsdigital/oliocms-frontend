"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useOlio } from "@/state/OlioProvider";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  isFirstWebsiteModalOpen?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
  isFirstWebsiteModalOpen,
}) => {
  const pathname = usePathname();
  const { projectState } = useOlio();
  const [projectDropdownOpen, setProjectDropdownOpen] = useState<boolean>(false);

  if (!isOpen) return null;

  const isNavActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div
      className={`md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-start ${
        isFirstWebsiteModalOpen ? "z-[120]" : "z-50"
      }`}
      onClick={onClose}
    >
      <div
        className="w-64 h-full glass-panel p-4 flex flex-col justify-between overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Navigation</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {/* Website Selector (Disabled when First Website Modal is Open) */}
          <div className={`relative border-b border-slate-200/40 dark:border-slate-800/40 pb-3 ${
            isFirstWebsiteModalOpen ? "pointer-events-none opacity-40 select-none" : ""
          }`}>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
              Active Website ({projectState.projects.length})
            </label>
            <button
              type="button"
              disabled={isFirstWebsiteModalOpen}
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 transition text-left"
            >
              <div className="truncate min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {projectState.selectedProject?.name || "Select Website"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {projectState.selectedProject?.defaultDomain ||
                    projectState.selectedProject?.domain ||
                    (projectState.projects.length === 0 ? "No website found" : "No domain set")}
                </p>
              </div>
              <i
                className={`fa-solid fa-chevron-down text-[10px] text-slate-400 transition-transform shrink-0 ${
                  projectDropdownOpen ? "rotate-180 text-brand-500" : ""
                }`}
              ></i>
            </button>

            {projectDropdownOpen && (
              <div className="mt-1.5 glass-panel rounded-xl p-1 z-50 border border-slate-200/50 dark:border-slate-800/50 flex flex-col">
                {projectState.projects.length > 0 ? (
                  <div className="space-y-1 max-h-[210px] overflow-y-auto pr-0.5">
                    {projectState.projects.map((proj) => {
                      const isSelected = proj.id === projectState.selectedProject?.id;
                      const displayDomain = proj.defaultDomain || proj.domain;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            projectState.selectProject(proj);
                            setProjectDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition ${
                            isSelected
                              ? "bg-brand-500/15 text-brand-500 font-semibold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="truncate min-w-0 pr-2">
                            <p className="text-xs font-semibold truncate leading-tight">{proj.name}</p>
                            {displayDomain && (
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                                {displayDomain}
                              </p>
                            )}
                          </div>
                          {isSelected && <i className="fa-solid fa-check text-xs text-brand-500 shrink-0"></i>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-2 py-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">No websites found</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links (Disabled when First Website Modal is Open) */}
          <nav className={`space-y-1.5 ${isFirstWebsiteModalOpen ? "pointer-events-none opacity-40 select-none" : ""}`}>
            <Link
              href="/dashboard"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/dashboard")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-chart-pie"></i> Dashboard
            </Link>
            <Link
              href="/media"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/media")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-images"></i> Media
            </Link>
            <Link
              href="/products"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/products")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-box"></i> Products
            </Link>
            <Link
              href="/brand"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/brand") || isNavActive("/brands")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-copyright"></i> Brands
            </Link>
            <Link
              href="/categories"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/categories")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-layer-group"></i> Categories
            </Link>
            <Link
              href="/tags"
              onClick={onClose}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                isNavActive("/tags")
                  ? "bg-brand-500 text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <i className="fa-solid fa-hashtag"></i> Tags
            </Link>
          </nav>
        </div>

        {/* Profile Settings & Logout (ALWAYS ENABLED) */}
        <div className="pt-4 border-t border-slate-200/30 dark:border-slate-800/30 space-y-2 pointer-events-auto">
          <Link
            href="/profile-settings"
            onClick={onClose}
            className="block w-full text-left text-xs font-medium text-slate-700 dark:text-slate-200 py-1.5"
          >
            <i className="fa-solid fa-user-gear mr-2"></i> Profile Settings
          </Link>
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full text-left text-xs font-medium text-rose-500 py-1.5 font-bold"
          >
            <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};
