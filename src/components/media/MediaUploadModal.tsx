"use client";

import React, { useRef, useState } from "react";
import { NewMediaForm } from "@/models/media.model";

interface MediaUploadModalProps {
  isOpen: boolean;
  newMedia: NewMediaForm;
  isUploading?: boolean;
  onFormChange: (fields: Partial<NewMediaForm>) => void;
  onUpload: () => void;
  onClose: () => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  newMedia,
  isUploading = false,
  onFormChange,
  onUpload,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (!file) {
      onFormChange({ file: null });
      setPreviewUrl(null);
      return;
    }

    onFormChange({
      file,
      name: newMedia.name || file.name.replace(/\.[^/.]+$/, ""),
    });

    // Create object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleModalClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
      onClick={handleModalClose}
    >
      <div
        className="w-full max-w-md glass-panel p-6 rounded-2xl shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Media Asset</h3>
              <p className="text-[10px] text-slate-400">Stores in Cloudflare R2 website folder</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === "file"
                ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className="fa-solid fa-file-arrow-up mr-1.5 text-[10px]"></i>
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${
              activeTab === "url"
                ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <i className="fa-solid fa-link mr-1.5 text-[10px]"></i>
            Image URL
          </button>
        </div>

        {activeTab === "file" ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />

            {previewUrl && newMedia.file ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-900/40 border border-brand-500/30 p-2 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="w-14 h-14 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{newMedia.file.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {(newMedia.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleFileChange(null)}
                  className="w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition"
                  title="Remove file"
                >
                  <i className="fa-solid fa-trash-can text-xs"></i>
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition ${
                  dragActive
                    ? "border-brand-500 bg-brand-500/10"
                    : "border-slate-300 dark:border-slate-700/80 hover:border-brand-500/60 bg-slate-50 dark:bg-slate-900/30"
                }`}
              >
                <div className="w-10 h-10 mx-auto rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center mb-2">
                  <i className="fa-solid fa-arrow-up-from-bracket text-sm"></i>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to browse or drag and drop
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, WEBP, GIF or SVG up to 20MB
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              External Image URL
            </label>
            <input
              type="url"
              value={newMedia.url}
              onChange={(e) => onFormChange({ url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={isUploading}
            className="px-3.5 py-1.5 rounded-xl glass-card text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onUpload}
            disabled={isUploading || (!newMedia.file && !newMedia.url?.trim())}
            className="px-4 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium shadow-md shadow-brand-500/20 transition flex items-center gap-1.5"
          >
            {isUploading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                <span>Upload to R2</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
