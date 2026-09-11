"use client";

import React, { useState } from "react";
import { MediaItem } from "@/models/media.model";

interface MediaGridProps {
  mediaList: MediaItem[];
  isLoading?: boolean;
  onDeleteMedia: (id: number | string) => void;
  selectedProjectId?: string;
  isFiltered?: boolean;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  mediaList,
  isLoading,
  onDeleteMedia,
  selectedProjectId,
  isFiltered = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string | number, boolean>>({});

  const handleCopy = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = item.url || item.path || item.name;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!selectedProjectId) {
    return (
      <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
          <i className="fa-solid fa-globe text-2xl"></i>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Website Selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please select a website from the header dropdown to explore and manage its Cloudflare R2 media files.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-2.5 space-y-2 animate-pulse">
            <div className="aspect-square rounded-lg bg-slate-200 dark:bg-slate-800/80"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
            <div className="flex justify-between">
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mediaList.length === 0) {
    return (
      <div className="glass-panel p-16 rounded-2xl text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
          <i className={`fa-solid ${isFiltered ? "fa-magnifying-glass" : "fa-cloud-arrow-up"} text-2xl`}></i>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          {isFiltered ? "No Matching Media Files" : "No Media Files in Cloudflare R2"}
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {isFiltered
            ? "No files match your search criteria. Try a different keyword or clear your search."
            : "No files were found in the folder for this website. Click \"Upload Asset\" to upload your first image to Cloudflare R2."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {mediaList.map((item) => {
          const hasError = imgErrors[item.id];
          const isCopied = copiedId === item.id;

          return (
            <div
              key={item.id}
              onClick={() => setPreviewItem(item)}
              className="glass-card rounded-xl p-2.5 space-y-2 group relative cursor-pointer hover:border-brand-500/40 hover:shadow-lg transition-all"
            >
              <div className="aspect-square rounded-lg overflow-hidden relative bg-slate-900/60 flex items-center justify-center">
                {!hasError && item.url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-center p-3 text-slate-500">
                    <i className="fa-solid fa-file-image text-2xl mb-1"></i>
                    <p className="text-[9px] uppercase font-mono">{item.format || "FILE"}</p>
                  </div>
                )}

                {/* Top Action Overlay */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition duration-200">
                  {/* Copy Link Button */}
                  <button
                    onClick={(e) => handleCopy(item, e)}
                    className="w-6 h-6 rounded-md bg-slate-900/80 text-white hover:bg-brand-500 flex items-center justify-center shadow backdrop-blur-sm transition"
                    title={isCopied ? "Copied!" : "Copy image URL"}
                  >
                    <i className={`fa-solid ${isCopied ? "fa-check text-emerald-400" : "fa-copy"} text-[10px]`}></i>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${item.name}" from Cloudflare R2?`)) {
                        onDeleteMedia(item.id);
                      }
                    }}
                    className="w-6 h-6 rounded-md bg-rose-600/90 text-white hover:bg-rose-600 flex items-center justify-center shadow backdrop-blur-sm transition"
                    title="Delete file from R2"
                  >
                    <i className="fa-solid fa-trash text-[10px]"></i>
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-900 dark:text-white truncate" title={item.name}>
                  {item.name}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>{item.size}</span>
                  <span className="uppercase font-mono px-1 rounded bg-slate-100 dark:bg-slate-800 text-[9px]">
                    {item.format}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Media Detail Preview Modal */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-2xl glass-panel p-5 rounded-2xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
              <div className="truncate pr-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{previewItem.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{previewItem.path || previewItem.key || ""}</span>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-7 h-7 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            </div>

            {/* Preview Image */}
            <div className="flex-1 min-h-0 bg-slate-900/70 rounded-xl overflow-hidden flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewItem.url}
                alt={previewItem.name}
                className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Metadata and Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                <span>Size: <strong className="text-slate-800 dark:text-slate-200">{previewItem.size}</strong></span>
                <span>Format: <strong className="text-slate-800 dark:text-slate-200 uppercase">{previewItem.format}</strong></span>
                {previewItem.lastModified && (
                  <span>Modified: <strong className="text-slate-800 dark:text-slate-200">{new Date(previewItem.lastModified).toLocaleDateString()}</strong></span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleCopy(previewItem, e)}
                  className="px-3 py-1.5 rounded-xl glass-card text-[11px] font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <i className={`fa-solid ${copiedId === previewItem.id ? "fa-check text-emerald-500" : "fa-copy"} text-[10px]`}></i>
                  <span>{copiedId === previewItem.id ? "Copied" : "Copy Link"}</span>
                </button>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-medium shadow transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                  <span>Open Full Image</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
