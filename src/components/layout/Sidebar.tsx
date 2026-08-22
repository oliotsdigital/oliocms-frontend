"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSession } from "@/models/auth.model";
import { useOlio } from "@/state/OlioProvider";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface SidebarProps {
  user: UserSession | null;
  onLogout: () => void;
  isFirstWebsiteModalOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, onLogout, isFirstWebsiteModalOpen }) => {
  const pathname = usePathname();
  const { collectionsState } = useOlio();
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);

  const isNavActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <aside
      onMouseEnter={() => setSidebarExpanded(true)}
      onMouseLeave={() => {
        setSidebarExpanded(false);
      }}
      className={`fixed top-0 left-0 h-full glass-panel transition-all duration-300 ease-in-out flex flex-col border-r border-slate-200/50 dark:border-slate-800/50 hidden md:flex ${
        isFirstWebsiteModalOpen ? "z-[110]" : "z-40"
      } ${
        sidebarExpanded ? "w-60 shadow-2xl" : "w-16"
      }`}
    >
      {/* Top Logo Header */}
      <div
        className={`h-16 flex items-center px-4 justify-center overflow-hidden border-b border-slate-200/30 dark:border-slate-800/30 ${
          isFirstWebsiteModalOpen ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <Link href="/dashboard" className="relative w-full h-9 flex items-center justify-center">
          <div
            className={`w-full flex items-center justify-center px-2 ${
              sidebarExpanded ? "" : "invisible absolute pointer-events-none"
            }`}
          >
            <BrandLogo className="h-8 md:h-9 max-w-[180px] mx-auto" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos/olioverse_icon.png"
            alt="Olioverse Icon"
            className={`w-8 h-8 md:w-9 md:h-9 object-contain mx-auto ${sidebarExpanded ? "invisible absolute" : ""}`}
          />
        </Link>
      </div>

      {/* Navigation Links (Disabled when First Website Popup is open) */}
      <nav
        className={`flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto ${
          isFirstWebsiteModalOpen
            ? "pointer-events-none opacity-40 select-none"
            : ""
        }`}
      >
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
            isNavActive("/dashboard")
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <i className="fa-solid fa-chart-pie text-sm w-5 text-center"></i>
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
            }`}
          >
            Dashboard
          </span>
        </Link>

        {/* Media */}
        <Link
          href="/media"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
            isNavActive("/media")
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <i className="fa-solid fa-images text-sm w-5 text-center"></i>
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
            }`}
          >
            Media
          </span>
        </Link>

        {/* Section: Collections */}
        <div className="pt-2 pb-1 px-3">
          <p
            className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            }`}
          >
            Collections
          </p>
          {!sidebarExpanded && <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60 my-1" />}
        </div>

        {/* Dynamic User Created Collection Links */}
        {collectionsState.collections.map((col) => (
          <Link
            key={col.id}
            href={`/collections/${col.id}`}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group relative ${
              pathname === `/collections/${col.id}`
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className={`fa-solid ${col.icon || "fa-cube"} text-sm w-5 text-center ${
              pathname === `/collections/${col.id}` ? "text-white" : "text-brand-500 group-hover:text-brand-400"
            }`}></i>
            <span
              className={`whitespace-nowrap truncate transition-opacity duration-200 ${
                sidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
              }`}
            >
              {col.name}
            </span>
          </Link>
        ))}

        {/* Section: Web Content */}
        <div className="pt-2 pb-1 px-3">
          <p
            className={`text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden"
            }`}
          >
            Web Content
          </p>
          {!sidebarExpanded && <div className="w-full h-px bg-slate-200/60 dark:bg-slate-800/60 my-1" />}
        </div>

        {/* Dynamic Collections */}
        <Link
          href="/collections"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative ${
            isNavActive("/collections")
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <i className="fa-solid fa-database text-sm w-5 text-center"></i>
          <span
            className={`whitespace-nowrap transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
            }`}
          >
            Collections
          </span>
        </Link>
      </nav>

      {/* Bottom Profile Icon Section (ALWAYS ENABLED) */}
      <div className="p-2 border-t border-slate-200/30 dark:border-slate-800/30 relative pointer-events-auto">
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="w-full flex items-center gap-3 p-2 rounded-xl glass-card hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition ring-1 ring-brand-500/20 shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user?.avatar ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.avatar}
              alt="User Profile"
              className="w-8 h-8 rounded-lg object-cover ring-2 ring-brand-500/50"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs ring-2 ring-brand-500/50">
              <i className="fa-solid fa-user"></i>
            </div>
          )}
          <div
            className={`text-left overflow-hidden transition-opacity duration-200 ${
              sidebarExpanded ? "opacity-100" : "opacity-0 w-0 hidden"
            }`}
          >
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user?.name || "Account"}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user?.role || ""}
            </p>
          </div>
        </button>

        {/* Profile Menu Popover */}
        {profileMenuOpen && (
          <div className="absolute bottom-16 left-3 w-48 glass-panel p-1.5 rounded-xl shadow-2xl z-50 space-y-1">
            <Link
              href="/profile-settings"
              onClick={() => setProfileMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-brand-500 hover:text-white transition"
            >
              <i className="fa-solid fa-user-gear text-xs"></i>
              <span>Profile Settings</span>
            </Link>
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-500 hover:text-white transition"
            >
              <i className="fa-solid fa-arrow-right-from-bracket text-xs"></i>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
