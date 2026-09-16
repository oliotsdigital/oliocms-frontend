"use client";

import React, { useEffect, useState, useMemo } from "react";
import { CollectionRecord, CollectionSchema, SeoMetadata } from "@/models/collection.model";
import { fetchCollectionRecordsApi } from "@/api/collection.api";
import { useOlio } from "@/state/OlioProvider";
import { resolveMediaUrl } from "@/utils/media";
import { EditRecordModal } from "@/components/collections/EditRecordModal";
import { FrontendSeoHelpModal } from "./FrontendSeoHelpModal";

export const SeoStudioView: React.FC = () => {
  const { collectionsState, toast } = useOlio();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"all" | "configured" | "fallback" | "noindex">("all");

  // Modals
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<CollectionRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Auto-select first collection if available
  useEffect(() => {
    if (collectionsState.collections.length > 0 && !selectedCollectionId) {
      setSelectedCollectionId(collectionsState.collections[0].id);
    }
  }, [collectionsState.collections, selectedCollectionId]);

  const selectedCollection = useMemo<CollectionSchema | null>(() => {
    return collectionsState.collections.find((c) => c.id === selectedCollectionId) || null;
  }, [collectionsState.collections, selectedCollectionId]);

  // Load records when selected collection changes
  const loadRecords = async (collectionId: string) => {
    if (!collectionId) return;
    setLoadingRecords(true);
    const res = await fetchCollectionRecordsApi(collectionId);
    setRecords(res.data || []);
    setLoadingRecords(false);
  };

  useEffect(() => {
    if (selectedCollectionId) {
      loadRecords(selectedCollectionId);
    }
  }, [selectedCollectionId]);

  // Helper to extract SEO object from record
  const getRecordSeo = (record: CollectionRecord): SeoMetadata => {
    return record.data?.seo || {};
  };

  // Helper to check if custom SEO is configured
  const isCustomSeoConfigured = (record: CollectionRecord): boolean => {
    const seo = getRecordSeo(record);
    return Boolean(
      seo.title?.trim() ||
        seo.description?.trim() ||
        seo.keywords?.trim() ||
        seo.og_image?.trim() ||
        seo.canonical_url?.trim() ||
        seo.no_index
    );
  };

  // Statistics Calculation
  const stats = useMemo(() => {
    let configuredCount = 0;
    let fallbackCount = 0;
    let noindexCount = 0;
    let missingDescCount = 0;

    records.forEach((record) => {
      const seo = getRecordSeo(record);
      const isConfigured = isCustomSeoConfigured(record);

      if (isConfigured) configuredCount++;
      else fallbackCount++;

      if (seo.no_index) noindexCount++;
      if (!seo.description?.trim()) missingDescCount++;
    });

    const total = records.length;
    const healthPercent = total > 0 ? Math.round((configuredCount / total) * 100) : 0;

    return {
      total,
      configuredCount,
      fallbackCount,
      noindexCount,
      missingDescCount,
      healthPercent,
    };
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const data = record.data || {};
      const seo = data.seo || {};

      const recordTitle = String(data.title || data.name || "Untitled Record").toLowerCase();
      const recordSlug = String(data.slug || "").toLowerCase();
      const metaTitle = String(seo.title || "").toLowerCase();

      const matchesSearch =
        !searchQuery.trim() ||
        recordTitle.includes(searchQuery.toLowerCase()) ||
        recordSlug.includes(searchQuery.toLowerCase()) ||
        metaTitle.includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === "configured") return isCustomSeoConfigured(record);
      if (filterTab === "fallback") return !isCustomSeoConfigured(record);
      if (filterTab === "noindex") return Boolean(seo.no_index);

      return true;
    });
  }, [records, searchQuery, filterTab]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 to-sky-500 flex items-center justify-center text-white shadow-xl shadow-brand-500/20 shrink-0">
            <i className="fa-solid fa-magnifying-glass-chart text-2xl"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                SEO Studio
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-500 border border-brand-500/30">
                Headless CMS SEO
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Audit, customize, and optimize search engine metadata for all collection records
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 z-10 shrink-0">
          <button
            type="button"
            onClick={() => setIsHelpModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 hover:from-brand-600 hover:to-sky-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2 group"
          >
            <i className="fa-solid fa-circle-question text-sm group-hover:scale-110 transition-transform"></i>
            <span>How to use SEO in Frontend</span>
          </button>

          <button
            type="button"
            onClick={() => selectedCollectionId && loadRecords(selectedCollectionId)}
            disabled={loadingRecords || !selectedCollectionId}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition border border-slate-200 dark:border-slate-700"
            title="Refresh Records"
          >
            <i className={`fa-solid fa-rotate-right text-xs ${loadingRecords ? "animate-spin" : ""}`}></i>
          </button>
        </div>
      </div>

      {/* Collection Selector Tabs */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
          Select Collection ({collectionsState.collections.length})
        </label>

        {collectionsState.collections.length > 0 ? (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {collectionsState.collections.map((col) => {
              const isSelected = col.id === selectedCollectionId;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setSelectedCollectionId(col.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2.5 shrink-0 border ${
                    isSelected
                      ? "bg-brand-500 text-white border-brand-500 shadow-md shadow-brand-500/20"
                      : "bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                  }`}
                >
                  <i className={`fa-solid ${col.icon || "fa-cube"} text-sm`}></i>
                  <span>{col.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 glass-panel rounded-2xl text-center text-slate-400 text-xs">
            No collections found. Create a collection to manage SEO records.
          </div>
        )}
      </div>

      {selectedCollection && (
        <>
          {/* SEO Audit Health Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Records
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {stats.total}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                In <span className="font-semibold text-brand-500">{selectedCollection.name}</span>
              </p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SEO Custom Configured
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                  {stats.healthPercent}%
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-500">
                {stats.configuredCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Custom titles & descriptions</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Using Auto Fallbacks
              </span>
              <div className="text-2xl font-black text-amber-500">
                {stats.fallbackCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Will fallback to record title</p>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                No-Index (Search Hidden)
              </span>
              <div className="text-2xl font-black text-rose-500">
                {stats.noindexCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Disallowed from web crawlers</p>
            </div>
          </div>

          {/* Table Toolbar (Search & Filter Tabs) */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterTab("all")}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  filterTab === "all"
                    ? "bg-white dark:bg-slate-800 text-brand-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                All Records ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("configured")}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  filterTab === "configured"
                    ? "bg-white dark:bg-slate-800 text-emerald-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Configured ({stats.configuredCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("fallback")}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  filterTab === "fallback"
                    ? "bg-white dark:bg-slate-800 text-amber-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                Auto Fallbacks ({stats.fallbackCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab("noindex")}
                className={`px-3.5 py-1.5 rounded-lg font-semibold transition ${
                  filterTab === "noindex"
                    ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                No-Index ({stats.noindexCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search record title or slug..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Records Table */}
          <div className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-xl">
            {loadingRecords ? (
              <div className="p-12 text-center space-y-3">
                <i className="fa-solid fa-spinner animate-spin text-2xl text-brand-500"></i>
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading collection records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Record Title & Slug</th>
                      <th className="py-3.5 px-4">Meta Title</th>
                      <th className="py-3.5 px-4">Meta Description</th>
                      <th className="py-3.5 px-4">Social Image</th>
                      <th className="py-3.5 px-4">Indexing</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs">
                    {filteredRecords.map((record) => {
                      const data = record.data || {};
                      const seo = getRecordSeo(record);

                      const title = data.title || data.name || "Untitled Record";
                      const slug = data.slug || "no-slug";

                      const metaTitle = seo.title?.trim();
                      const metaDesc = seo.description?.trim();
                      const ogImage = seo.og_image?.trim();

                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-slate-100/40 dark:hover:bg-slate-800/30 transition group"
                        >
                          {/* Record Title & Slug */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                              {title}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px] mt-0.5">
                              /{selectedCollection.slug}/{slug}
                            </div>
                          </td>

                          {/* Meta Title */}
                          <td className="py-3.5 px-4">
                            {metaTitle ? (
                              <div className="space-y-0.5">
                                <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[180px]">
                                  {metaTitle}
                                </div>
                                <span
                                  className={`text-[9px] font-bold ${
                                    metaTitle.length <= 60 ? "text-emerald-500" : "text-amber-500"
                                  }`}
                                >
                                  {metaTitle.length} chars
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <i className="fa-solid fa-arrows-rotate text-[9px]"></i> Uses Fallback
                              </span>
                            )}
                          </td>

                          {/* Meta Description */}
                          <td className="py-3.5 px-4">
                            {metaDesc ? (
                              <div className="space-y-0.5 max-w-[220px]">
                                <div className="text-slate-600 dark:text-slate-400 truncate">
                                  {metaDesc}
                                </div>
                                <span
                                  className={`text-[9px] font-bold ${
                                    metaDesc.length <= 160 ? "text-emerald-500" : "text-amber-500"
                                  }`}
                                >
                                  {metaDesc.length} / 160 chars
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                Not Specified
                              </span>
                            )}
                          </td>

                          {/* Social Image */}
                          <td className="py-3.5 px-4">
                            {ogImage ? (
                              <div className="w-10 h-7 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolveMediaUrl(ogImage)}
                                  alt="OG Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400">No Image</span>
                            )}
                          </td>

                          {/* Indexing */}
                          <td className="py-3.5 px-4">
                            {seo.no_index ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                <i className="fa-solid fa-eye-slash text-[9px]"></i> No-Index
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <i className="fa-solid fa-check text-[9px]"></i> Indexed
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRecord(record);
                                setIsEditModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-brand-500/15 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-semibold transition border border-brand-500/30 flex items-center gap-1.5 ml-auto"
                            >
                              <i className="fa-solid fa-pen-to-square text-[11px]"></i>
                              <span>Edit SEO</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center space-y-2">
                <i className="fa-solid fa-magnifying-glass text-3xl text-slate-400"></i>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  No records match filter
                </h3>
                <p className="text-xs text-slate-400">
                  Try adjusting your search query or switching filter tabs.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Frontend Integration Help Modal */}
      <FrontendSeoHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        selectedCollectionSlug={selectedCollection?.slug || "collection"}
      />

      {/* Edit Record SEO Modal */}
      {selectedCollection && editingRecord && (
        <EditRecordModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
          }}
          schema={selectedCollection}
          record={editingRecord}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingRecord(null);
            if (selectedCollectionId) loadRecords(selectedCollectionId);
            if (toast) toast.showToast("Record SEO metadata updated successfully!", "success");
          }}
        />
      )}
    </div>
  );
};
