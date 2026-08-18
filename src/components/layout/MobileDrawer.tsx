"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  onLogout,
}) => {
  const pathname = usePathname();

  if (!isOpen) return null;

  const isNavActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  return (
    <div
      className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-start"
      onClick={onClose}
    >
      <div
        className="w-64 h-full glass-panel p-4 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/30 dark:border-slate-800/30 pb-3">
            <span className="font-bold text-sm text-slate-900 dark:text-white">Navigation</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
          <nav className="space-y-1.5">
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
        <div className="pt-4 border-t border-slate-200/30 dark:border-slate-800/30 space-y-2">
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
            className="w-full text-left text-xs font-medium text-rose-500 py-1.5"
          >
            <i className="fa-solid fa-right-from-bracket mr-2"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};
