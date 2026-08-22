"use client";

import React from "react";

interface QuickStatsGridProps {
  totalCollections: number;
  totalMedia: number;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  totalCollections,
  totalMedia,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-sm font-bold">
          <i className="fa-solid fa-database"></i>
        </div>
        <div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Total Collections</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{totalCollections}</span>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm font-bold">
          <i className="fa-solid fa-images"></i>
        </div>
        <div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Media Files</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{totalMedia}</span>
        </div>
      </div>
    </div>
  );
};
