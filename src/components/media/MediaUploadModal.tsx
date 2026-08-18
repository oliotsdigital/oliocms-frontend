"use client";

import React from "react";
import { NewMediaForm } from "@/models/media.model";

interface MediaUploadModalProps {
  isOpen: boolean;
  newMedia: NewMediaForm;
  onFormChange: (fields: Partial<NewMediaForm>) => void;
  onUpload: () => void;
  onClose: () => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  newMedia,
  onFormChange,
  onUpload,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Media Asset</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Image Name</label>
          <input
            type="text"
            value={newMedia.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            placeholder="banner-winter-sale"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Unsplash / Image URL
          </label>
          <input
            type="text"
            value={newMedia.url}
            onChange={(e) => onFormChange({ url: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl glass-card text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onUpload}
            className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-md shadow-brand-500/20 transition"
          >
            Upload File
          </button>
        </div>
      </div>
    </div>
  );
};
