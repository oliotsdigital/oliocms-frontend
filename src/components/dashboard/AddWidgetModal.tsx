"use client";

import React, { useState } from "react";
import { CollectionSchema } from "@/models/collection.model";
import { WidgetWidth } from "@/models/widget.model";

interface AddWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (data: { collectionId: string; width: WidgetWidth; limit: number }) => void;
  collections: CollectionSchema[];
}

export const AddWidgetModal: React.FC<AddWidgetModalProps> = ({
  isOpen,
  onClose,
  onAddWidget,
  collections,
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(collections[0]?.id || "");
  const [width, setWidth] = useState<WidgetWidth>("1/3");
  const [limit, setLimit] = useState<number>(5);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollectionId) {
      setError("Please select a collection to display in this widget.");
      return;
    }
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 5));
    onAddWidget({
      collectionId: selectedCollectionId,
      width,
      limit: safeLimit,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg glass-panel p-6 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-800/60 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <i className="fa-solid fa-table text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add Collection Widget
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose a collection and layout to pin records to your dashboard
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-xs"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. Collection Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Collection *
            </label>
            {collections.length > 0 ? (
              <select
                value={selectedCollectionId}
                onChange={(e) => setSelectedCollectionId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm"
              >
                {collections.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name} (/{col.slug}) — {col.schema_definition?.length || 0} fields
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                No dynamic collections found for this website. Create a collection in the Collections section first.
              </div>
            )}
          </div>

          {/* 2. Width Selector (1/3, 2/3, 3/3) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Widget Width *
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(["1/3", "2/3", "3/3"] as WidgetWidth[]).map((opt) => {
                const isSelected = width === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setWidth(opt)}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      isSelected
                        ? "bg-brand-500/15 border-brand-500 text-brand-500 ring-2 ring-brand-500/30 font-bold shadow-sm"
                        : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-1 w-12 h-3 bg-slate-200 dark:bg-slate-700 rounded p-0.5">
                      <div
                        className={`h-full rounded-sm transition-all ${
                          isSelected ? "bg-brand-500" : "bg-slate-400 dark:bg-slate-500"
                        } ${
                          opt === "1/3" ? "w-1/3" : opt === "2/3" ? "w-2/3" : "w-full"
                        }`}
                      />
                    </div>
                    <span className="text-xs font-bold">{opt} Width</span>
                    <span className="text-[10px] text-slate-400">
                      {opt === "1/3" ? "Compact" : opt === "2/3" ? "Expanded" : "Full Row"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Number of records to show */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              How many records to display *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setLimit(num)}
                  className={`py-2 rounded-xl border text-xs font-bold transition text-center ${
                    limit === num
                      ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/25"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {num} records
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">Or custom limit:</span>
              <input
                type="number"
                min={1}
                max={50}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                className="w-20 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <span className="text-[10px] text-slate-400">(max 50)</span>
            </div>
          </div>

          {/* Note regarding media */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <i className="fa-solid fa-eye-slash text-slate-400"></i>
            <span>Media & images are automatically omitted for clean, high-density tabular display.</span>
          </div>

          {/* Footer CTAs */}
          <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedCollectionId}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Add to Dashboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
