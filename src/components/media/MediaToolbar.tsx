"use client";

import React from "react";

interface MediaToolbarProps {
  mediaSearch: string;
  onSearchChange: (val: string) => void;
  onOpenUploadModal: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  totalCount?: number;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  mediaSearch,
  onSearchChange,
  onOpenUploadModal,
  onRefresh,
  isLoading,
  totalCount = 0,
}) => {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Media */}
        <div className="relative w-full md:w-64">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={mediaSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search media by filename..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Cloudflare R2 Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[11px] font-medium">
          <i className="fa-solid fa-cloud"></i>
          <span>Cloudflare R2</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-orange-500/20 font-mono">
            {totalCount} {totalCount === 1 ? "file" : "files"}
          </span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition hover:scale-105 active:scale-95 disabled:opacity-50"
            title="Refresh files from Cloudflare R2"
          >
            <i className={`fa-solid fa-arrows-rotate text-xs ${isLoading ? "animate-spin text-brand-500" : ""}`}></i>
          </button>
        )}
      </div>

      <button
        onClick={onOpenUploadModal}
        className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
      >
        <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
        <span>Upload Asset</span>
      </button>
    </div>
  );
};
