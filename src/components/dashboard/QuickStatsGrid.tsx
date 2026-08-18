"use client";

import React from "react";

interface QuickStatsGridProps {
  totalProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalMedia: number;
}

export const QuickStatsGrid: React.FC<QuickStatsGridProps> = ({
  totalProducts,
  totalCategories,
  totalBrands,
  totalMedia,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-sm font-bold">
          <i className="fa-solid fa-box"></i>
        </div>
        <div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Total Products</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{totalProducts}</span>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-sm font-bold">
          <i className="fa-solid fa-layer-group"></i>
        </div>
        <div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Categories</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{totalCategories}</span>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center text-sm font-bold">
          <i className="fa-solid fa-copyright"></i>
        </div>
        <div>
          <span className="block text-xs text-slate-500 dark:text-slate-400">Active Brands</span>
          <span className="text-base font-bold text-slate-900 dark:text-white">{totalBrands}</span>
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
