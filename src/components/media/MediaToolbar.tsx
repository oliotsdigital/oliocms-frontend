"use client";

import React from "react";

interface MediaToolbarProps {
  mediaSearch: string;
  onSearchChange: (val: string) => void;
  onOpenUploadModal: () => void;
}

export const MediaToolbar: React.FC<MediaToolbarProps> = ({
  mediaSearch,
  onSearchChange,
  onOpenUploadModal,
}) => {
  return (
    <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Media */}
        <div className="relative w-full md:w-60">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={mediaSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search media by title..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <button
        onClick={onOpenUploadModal}
        className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
      >
        <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
        <span>Upload Asset</span>
      </button>
    </div>
  );
};
