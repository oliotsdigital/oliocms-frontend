"use client";

import React, { useState } from "react";
import { SeoMetadata } from "@/models/collection.model";
import { MediaFieldInput } from "./MediaFieldInput";
import { resolveMediaUrl } from "@/utils/media";

interface SeoFormSectionProps {
  seo: SeoMetadata;
  onChange: (newSeo: SeoMetadata) => void;
  fallbackTitle?: string;
  fallbackSlug?: string;
  collectionSlug?: string;
  projectId?: string;
  disabled?: boolean;
  defaultExpanded?: boolean;
}

export const SeoFormSection: React.FC<SeoFormSectionProps> = ({
  seo,
  onChange,
  fallbackTitle = "",
  fallbackSlug = "",
  collectionSlug = "collection",
  projectId,
  disabled = false,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [previewTab, setPreviewTab] = useState<"google" | "social">("google");

  const updateField = <K extends keyof SeoMetadata>(key: K, value: SeoMetadata[K]) => {
    onChange({
      ...seo,
      [key]: value,
    });
  };

  const currentTitle = seo.title || "";
  const currentDescription = seo.description || "";
  const currentKeywords = seo.keywords || "";
  const currentCanonical = seo.canonical_url || "";
  const currentOgImage = seo.og_image || "";
  const currentNoIndex = Boolean(seo.no_index);

  const displayTitle = currentTitle.trim() || fallbackTitle.trim() || "Untitled Record";
  const displaySlug = fallbackSlug.trim() || "entry-slug";
  const displayDescription =
    currentDescription.trim() ||
    "No meta description specified. Search engines will automatically extract a snippet from this record's content.";

  const isConfigured = Boolean(
    currentTitle.trim() ||
    currentDescription.trim() ||
    currentKeywords.trim() ||
    currentOgImage.trim() ||
    currentCanonical.trim() ||
    currentNoIndex
  );

  const titleLength = currentTitle.length;
  const descLength = currentDescription.length;

  return (
    <div className="glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-xl overflow-hidden transition-all">
      {/* Accordion Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500/20 to-sky-500/20 flex items-center justify-center text-brand-500 shadow-sm border border-brand-500/20 group-hover:scale-105 transition">
            <i className="fa-solid fa-magnifying-glass-chart text-base"></i>
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Search Engine Optimization (SEO) & Social Sharing
              </h3>
              {isConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <i className="fa-solid fa-check text-[9px]"></i> Configured
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  Auto Fallbacks
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Customize title tags, descriptions, Open Graph preview, and search crawler indexing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-brand-500 hidden sm:inline">
            {isExpanded ? "Collapse" : "Edit SEO"}
          </span>
          <div
            className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180 text-brand-500" : ""
            }`}
          >
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </div>
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-200/40 dark:border-slate-800/40 space-y-6">
          {/* Live Preview Switcher & Card */}
          <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 p-4 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
                <i className="fa-solid fa-eye text-brand-500"></i> Real-time Preview
              </span>

              {/* Tabs */}
              <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab("google")}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    previewTab === "google"
                      ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-brands fa-google text-[11px]"></i> Google SERP
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("social")}
                  className={`px-3 py-1 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                    previewTab === "social"
                      ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <i className="fa-solid fa-share-nodes text-[11px]"></i> Social Card
                </button>
              </div>
            </div>

            {/* Google SERP Preview */}
            {previewTab === "google" && (
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-1.5 font-sans">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 text-[10px]">
                    <i className="fa-solid fa-globe"></i>
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                      example.com
                    </span>
                    <span className="text-[10px] text-slate-400 truncate max-w-md">
                      https://example.com › {collectionSlug} › {displaySlug}
                    </span>
                  </div>
                </div>

                <div className="pt-0.5">
                  <h4 className="text-base font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate max-w-xl">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed mt-1">
                    {displayDescription}
                  </p>
                </div>

                {currentNoIndex && (
                  <div className="pt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span>Notice: 'noindex' is active. Search engines will not index this URL.</span>
                  </div>
                )}
              </div>
            )}

            {/* Social Share Preview (Open Graph Card) */}
            {previewTab === "social" && (
              <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm max-w-lg">
                <div className="h-44 bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative overflow-hidden border-b border-slate-200/60 dark:border-slate-800">
                  {currentOgImage ? (
                    <img
                      src={resolveMediaUrl(currentOgImage)}
                      alt="Open Graph Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-1 text-slate-400">
                      <i className="fa-regular fa-image text-3xl"></i>
                      <p className="text-[11px]">No Social Share Image Selected</p>
                    </div>
                  )}
                </div>
                <div className="p-3.5 space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    EXAMPLE.COM
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {displayTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {displayDescription}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Meta Title */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meta Title
                </label>
                <span
                  className={`text-[10px] font-semibold ${
                    titleLength === 0
                      ? "text-slate-400"
                      : titleLength <= 60
                      ? "text-emerald-500"
                      : "text-amber-500 font-bold"
                  }`}
                >
                  {titleLength} / 60 characters
                  {titleLength > 60 && " (Long)"}
                </span>
              </div>
              <input
                type="text"
                value={currentTitle}
                disabled={disabled}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={fallbackTitle ? `Default: ${fallbackTitle}` : "Enter custom meta title..."}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <p className="text-[10px] text-slate-400">
                Search engine title tag. Leave empty to automatically use the record's primary title.
              </p>
            </div>

            {/* Meta Description */}
            <div className="space-y-1.5 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Meta Description
                </label>
                <span
                  className={`text-[10px] font-semibold ${
                    descLength === 0
                      ? "text-slate-400"
                      : descLength <= 160
                      ? "text-emerald-500"
                      : "text-amber-500 font-bold"
                  }`}
                >
                  {descLength} / 160 characters
                  {descLength > 160 && " (Search engines will truncate)"}
                </span>
              </div>
              <textarea
                rows={3}
                value={currentDescription}
                disabled={disabled}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Provide a compelling 1–2 sentence summary that entices search engine clicks..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-y"
              />
              <p className="text-[10px] text-slate-400">
                Shown below the page title in search engine results. Keep between 120 and 160 characters for best results.
              </p>
            </div>

            {/* Meta Keywords */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Meta Keywords
              </label>
              <input
                type="text"
                value={currentKeywords}
                disabled={disabled}
                onChange={(e) => updateField("keywords", e.target.value)}
                placeholder="e.g. ecommerce, fashion, trending"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <p className="text-[10px] text-slate-400">
                Optional comma-separated keyword tags for page metadata.
              </p>
            </div>

            {/* Canonical URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Canonical URL
              </label>
              <input
                type="url"
                value={currentCanonical}
                disabled={disabled}
                onChange={(e) => updateField("canonical_url", e.target.value)}
                placeholder="https://example.com/master-page"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              <p className="text-[10px] text-slate-400">
                Specify if this page content is duplicated or republished from an authoritative URL.
              </p>
            </div>

            {/* Social Share / OG Image */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Social Share Image (Open Graph / Twitter Card)
              </label>
              <MediaFieldInput
                field={{
                  name: "og_image",
                  label: "Open Graph Image",
                  type: "media",
                  validation: { required: false, unique: false },
                }}
                value={currentOgImage}
                onChange={(val) => updateField("og_image", val)}
                projectId={projectId}
                disabled={disabled}
              />
              <p className="text-[10px] text-slate-400">
                Optimal resolution: 1200 x 630 pixels. Used when sharing this entry on Twitter, Facebook, WhatsApp, and LinkedIn.
              </p>
            </div>

            {/* Robots No-Index Toggle */}
            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div className="space-y-0.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Disallow Search Engine Indexing (noindex)
                    </span>
                    {currentNoIndex ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        Hidden from search
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Indexed
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instructs Google, Bing, and other web crawlers to ignore and not index this entry.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => updateField("no_index", !currentNoIndex)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition shrink-0 ${
                    currentNoIndex
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  <div
                    className={`w-7 h-4 rounded-full p-0.5 transition ${
                      currentNoIndex ? "bg-amber-500" : "bg-slate-400"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        currentNoIndex ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </div>
                  <span>{currentNoIndex ? "No-Index Active" : "Allow Indexing"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
