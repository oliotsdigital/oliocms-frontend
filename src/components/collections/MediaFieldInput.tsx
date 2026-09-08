"use client";

import React, { useRef, useState, useEffect } from "react";
import { uploadMediaApi, fetchMediaApi } from "@/api/media.api";
import { resolveMediaUrl, DEFAULT_LAZY_IMAGE } from "@/utils/media";
import { useOlio } from "@/state/OlioProvider";
import { MediaItem } from "@/models/media.model";
import { FieldDefinition } from "@/models/collection.model";

interface MediaFieldInputProps {
  field: FieldDefinition;
  value?: string | null;
  onChange: (val: string) => void;
  projectId?: string;
  disabled?: boolean;
}

export const MediaFieldInput: React.FC<MediaFieldInputProps> = ({
  field,
  value,
  onChange,
  projectId,
  disabled = false,
}) => {
  const { toast } = useOlio();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const libraryUploadInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [urlInputValue, setUrlInputValue] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Media Library state
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [libraryItems, setLibraryItems] = useState<MediaItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState<boolean>(false);
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [libraryUploading, setLibraryUploading] = useState<boolean>(false);

  const currentValue = value || "";

  // Check if current value looks like an image
  const isImage = (val: string) => {
    if (!val) return false;
    const lower = val.toLowerCase();
    return (
      lower.includes(".png") ||
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".webp") ||
      lower.includes(".gif") ||
      lower.includes(".svg") ||
      lower.startsWith("data:image/") ||
      lower.includes("images.unsplash.com")
    );
  };

  const resolvedPreviewUrl = resolveMediaUrl(currentValue);

  // Handle direct file upload
  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadMediaApi(file, projectId);
      if (uploaded) {
        const storedValue = uploaded.url || uploaded.path || "";
        onChange(storedValue);
        if (toast) {
          toast.showToast(`Uploaded "${file.name}" successfully!`, "success");
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to upload file";
      setUploadError(msg);
      if (toast) {
        toast.showToast(msg, "error");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
    if (disabled || isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  // Open Media Library Modal & fetch files
  const openLibraryModal = async () => {
    setIsLibraryOpen(true);
    setLoadingLibrary(true);
    try {
      const files = await fetchMediaApi(projectId);
      setLibraryItems(files);
    } catch (err) {
      if (toast) toast.showToast("Failed to load media library files", "error");
    } finally {
      setLoadingLibrary(false);
    }
  };

  // Upload inside library modal
  const handleLibraryUpload = async (file: File) => {
    if (!file) return;
    setLibraryUploading(true);
    try {
      const uploaded = await uploadMediaApi(file, projectId);
      if (uploaded) {
        setLibraryItems((prev) => [uploaded, ...prev]);
        const storedValue = uploaded.url || uploaded.path || "";
        onChange(storedValue);
        setIsLibraryOpen(false);
        if (toast) {
          toast.showToast(`Uploaded & selected "${file.name}"!`, "success");
        }
      }
    } catch (err: any) {
      if (toast) {
        toast.showToast(err?.message || "Upload failed", "error");
      }
    } finally {
      setLibraryUploading(false);
      if (libraryUploadInputRef.current) {
        libraryUploadInputRef.current.value = "";
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInputValue.trim()) return;
    onChange(urlInputValue.trim());
    setUrlInputValue("");
    if (toast) toast.showToast("Media URL applied", "success");
  };

  const handleCopyUrl = async () => {
    if (!currentValue) return;
    try {
      await navigator.clipboard.writeText(resolvedPreviewUrl || currentValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (toast) toast.showToast("Copied media URL to clipboard", "success");
    } catch {
      // ignore
    }
  };

  // Filtered library items for search
  const filteredLibraryItems = libraryItems.filter((item) =>
    item.name.toLowerCase().includes(librarySearch.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Hidden File Input for Direct Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleUploadFile(e.target.files[0]);
          }
        }}
      />

      {/* Case 1: When a media value is already attached */}
      {currentValue ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 shadow-sm space-y-3">
          <div className="flex items-start gap-4">
            {/* Thumbnail or File Icon */}
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center shrink-0 relative group">
              {isImage(currentValue) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolvedPreviewUrl}
                  alt={field.label || field.name}
                  className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_LAZY_IMAGE;
                  }}
                />
              ) : (
                <div className="text-brand-500 flex flex-col items-center justify-center p-2 text-center">
                  <i className="fa-solid fa-file text-2xl mb-1"></i>
                  <span className="text-[9px] font-mono uppercase truncate max-w-[60px]">
                    {currentValue.split(".").pop() || "media"}
                  </span>
                </div>
              )}
            </div>

            {/* Media Info & Actions */}
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {currentValue.split("/").pop() || "Attached Media"}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold shrink-0">
                  <i className="fa-solid fa-check text-[9px]"></i> Attached
                </span>
              </div>

              <p
                className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-md"
                title={currentValue}
              >
                {currentValue}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {resolvedPreviewUrl && (
                  <a
                    href={resolvedPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                  >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> View Full
                  </a>
                )}

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <i className={`fa-solid ${copied ? "fa-check text-emerald-500" : "fa-copy text-[10px]"}`}></i>
                  {copied ? "Copied!" : "Copy Link"}
                </button>

                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 transition"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i> Replace File
                </button>

                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={openLibraryModal}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                >
                  <i className="fa-solid fa-photo-film text-[10px]"></i> Library
                </button>

                <button
                  type="button"
                  disabled={disabled || isUploading}
                  onClick={() => onChange("")}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10 transition ml-auto"
                >
                  <i className="fa-solid fa-trash-can text-[10px]"></i> Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: No file attached - provide file upload, media library & URL options */
        <div className="space-y-3">
          {/* Mode switch tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "upload"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <i className="fa-solid fa-cloud-arrow-up text-[11px]"></i>
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "url"
                    ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                <i className="fa-solid fa-link text-[11px]"></i>
                Link URL
              </button>
            </div>

            <button
              type="button"
              onClick={openLibraryModal}
              disabled={disabled || isUploading}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 text-slate-700 dark:text-slate-300 hover:text-brand-500 border border-slate-200/60 dark:border-slate-700/60 transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <i className="fa-solid fa-images text-brand-500 text-[11px]"></i>
              <span>Browse Library</span>
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === "upload" ? (
            <div>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                  if (!disabled && !isUploading) {
                    fileInputRef.current?.click();
                  }
                }}
                className={`relative p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                  dragActive
                    ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
                    : "border-slate-300 dark:border-slate-700 hover:border-brand-500/70 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-brand-500/[0.03]"
                } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
              >
                {isUploading ? (
                  <div className="py-3 flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-brand-500/15 text-brand-500 flex items-center justify-center animate-spin">
                      <i className="fa-solid fa-circle-notch text-lg"></i>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Uploading to Cloudflare R2...
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Please wait while your media file is securely stored
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center shadow-inner">
                      <i className="fa-solid fa-cloud-arrow-up text-lg"></i>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click to upload or drag & drop media file
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports Images, Videos, Audio, PDF & Docs (Cloudflare R2)
                      </p>
                    </div>
                    <div className="mt-1">
                      <span className="px-3 py-1 rounded-lg bg-brand-500 text-white text-[11px] font-bold shadow-sm inline-flex items-center gap-1.5">
                        <i className="fa-solid fa-plus text-[10px]"></i> Choose File
                      </span>
                    </div>
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                  <i className="fa-solid fa-circle-exclamation"></i>
                  {uploadError}
                </p>
              )}
            </div>
          ) : (
            /* URL Tab */
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://images.unsplash.com/... or public media URL"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!urlInputValue.trim()}
                  className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-check text-xs"></i> Apply
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                You can paste direct image links or public URLs hosted on CDNs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Media Library Modal Picker */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[140] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div
            className="w-full max-w-3xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[85vh] flex flex-col space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <i className="fa-solid fa-images text-sm"></i>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Media Asset Library
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Select an existing asset or upload a new one to attach to {field.label || field.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Hidden input for modal upload */}
                <input
                  ref={libraryUploadInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleLibraryUpload(e.target.files[0]);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={libraryUploading}
                  onClick={() => libraryUploadInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {libraryUploading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                      <span>Upload Asset</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsLibraryOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                placeholder="Search media files by name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Media Items Grid */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[250px]">
              {loadingLibrary ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : filteredLibraryItems.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                  {filteredLibraryItems.map((item) => {
                    const isImg = isImage(item.name) || isImage(item.url);
                    const resolvedUrl = resolveMediaUrl(item.url || item.path);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          const storedVal = item.url || item.path || "";
                          onChange(storedVal);
                          setIsLibraryOpen(false);
                          if (toast) toast.showToast(`Selected "${item.name}"`, "success");
                        }}
                        className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:border-brand-500 hover:shadow-md cursor-pointer transition p-2 flex flex-col justify-between overflow-hidden"
                      >
                        {/* Thumbnail */}
                        <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center relative">
                          {isImg ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolvedUrl}
                              alt={item.name}
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = DEFAULT_LAZY_IMAGE;
                              }}
                            />
                          ) : (
                            <i className="fa-solid fa-file text-2xl text-brand-500"></i>
                          )}

                          <div className="absolute inset-0 bg-brand-500/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="px-2 py-1 rounded-md bg-brand-500 text-white text-[10px] font-bold shadow-md">
                              Select
                            </span>
                          </div>
                        </div>

                        {/* Title & Size */}
                        <div className="mt-2 text-left">
                          <p
                            className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                            <span className="uppercase font-mono">{item.format || "file"}</span>
                            <span>{item.size || "—"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-56 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <i className="fa-solid fa-photo-film text-3xl mb-2 text-slate-300 dark:text-slate-600"></i>
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {librarySearch ? "No matching media files found" : "No media files uploaded yet"}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Click &quot;Upload Asset&quot; above to upload your first file to Cloudflare R2
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
              <span>{filteredLibraryItems.length} media file(s) available</span>
              <button
                type="button"
                onClick={() => setIsLibraryOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
