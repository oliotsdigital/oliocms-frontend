"use client";

import React, { useMemo } from "react";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  isLoading = false,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  // Generate pagination window: e.g. [1, "...", 4, 5, 6, "...", 12]
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    pages.push(1);

    if (safePage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (safePage < totalPages - 2) {
      pages.push("...");
    }

    pages.push(totalPages);
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="glass-panel rounded-2xl p-3.5 border border-slate-200/60 dark:border-slate-800/60 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs select-none">
      {/* Left: Rows Per Page & Item Range Summary */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            disabled={isLoading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer disabled:opacity-50"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="text-slate-500 dark:text-slate-400 font-medium">
          Showing{" "}
          <strong className="text-slate-900 dark:text-white font-bold">{startItem}</strong> -{" "}
          <strong className="text-slate-900 dark:text-white font-bold">{endItem}</strong> of{" "}
          <strong className="text-slate-900 dark:text-white font-bold">{totalItems}</strong> entries
        </div>
      </div>

      {/* Right: Page Navigation Controls */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1 || isLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="First Page"
        >
          <i className="fa-solid fa-angles-left text-[10px]"></i>
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1 || isLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <i className="fa-solid fa-chevron-left text-[10px]"></i>
        </button>

        {/* Numbered Page Buttons */}
        {pageNumbers.map((p, idx) => {
          if (typeof p === "string") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-7 text-center text-slate-400 font-bold"
              >
                …
              </span>
            );
          }

          const isActive = p === safePage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              disabled={isLoading}
              className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                isActive
                  ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 ring-2 ring-brand-500/50"
                  : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages || isLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages || isLoading}
          className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          title="Last Page"
        >
          <i className="fa-solid fa-angles-right text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};
