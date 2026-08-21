"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import {
  fetchCollectionSchemaApi,
  fetchCollectionRecordsApi,
  createCollectionRecordApi,
} from "@/api/collection.api";
import { DynamicFormModal } from "@/components/collections/DynamicFormModal";
import { DynamicDataTable } from "@/components/collections/DynamicDataTable";
import { useOlio } from "@/state/OlioProvider";

interface CollectionDetailViewProps {
  collectionId: string;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ collectionId }) => {
  const { toast } = useOlio();
  const [schema, setSchema] = useState<CollectionSchema | null>(null);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const schemaData = await fetchCollectionSchemaApi(collectionId);
    setSchema(schemaData);

    if (schemaData) {
      const filterParams = { ...activeFilters };
      if (search.trim()) filterParams["search"] = search.trim();
      const recordsData = await fetchCollectionRecordsApi(collectionId, filterParams);
      setRecords(recordsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (collectionId) {
      loadData();
    }
  }, [collectionId, search, activeFilters]);

  const handleExportData = () => {
    if (!schema || records.length === 0) {
      if (toast) toast.showToast("No records available to export", "error");
      return;
    }

    const exportPayload = records.map((r) => r.data);
    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${schema.slug}_export_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (toast) toast.showToast(`Exported ${records.length} records successfully!`, "success");
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !schema) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const itemsToImport = Array.isArray(parsed) ? parsed : [parsed];

      let count = 0;
      for (const item of itemsToImport) {
        if (typeof item === "object" && item !== null) {
          await createCollectionRecordApi(schema.id, item);
          count++;
        }
      }

      if (toast) toast.showToast(`Imported ${count} records successfully!`, "success");
      loadData();
    } catch (err) {
      if (toast) toast.showToast("Failed to parse JSON file for import", "error");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <AppLayout pageTitle={schema ? schema.name : "Collection Details"}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/collections" className="hover:text-brand-500 transition">
              Collections
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-slate-900 dark:text-white font-bold">
              {schema ? schema.name : "Loading..."}
            </span>
          </div>

          {schema && (
            <div className="text-xs font-semibold text-slate-500">
              Total Entries: <strong className="text-slate-900 dark:text-white">{records.length}</strong>
            </div>
          )}
        </div>

        {/* Top Header Action Container with Search Bar & Buttons */}
        {schema && (
          <div className="glass-panel rounded-2xl p-4 border border-slate-200/50 dark:border-slate-800/50 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input Bar */}
            <div className="relative flex-1 max-w-md w-full">
              <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${schema.name} records...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <input
                type="file"
                id="import-json-file"
                accept=".json"
                onChange={handleImportFileChange}
                className="hidden"
              />

              <label
                htmlFor="import-json-file"
                className="cursor-pointer px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Import JSON Data"
              >
                <i className="fa-solid fa-file-import text-xs"></i> Import Data
              </label>

              <Link
                href={`/collections/${schema.id}/apis`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="View & test public REST APIs for this collection"
              >
                <i className="fa-solid fa-code text-xs text-brand-500"></i> Get APIs
              </Link>

              <button
                onClick={handleExportData}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Export Collection Records as JSON"
              >
                <i className="fa-solid fa-file-export text-xs"></i> Export Data
              </button>

              <Link
                href={`/collections?id=${schema.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Edit Collection Schema & Fields"
              >
                <i className="fa-solid fa-pen-to-square text-xs"></i> Edit Collection
              </Link>

              <button
                onClick={loadData}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Refresh Records"
              >
                <i className="fa-solid fa-arrows-rotate text-xs"></i> Refresh
              </button>

              <Link
                href={`/collections/${schema.id}/add-record`}
                className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition transform active:scale-95 flex items-center gap-2 shrink-0"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add {schema.name}
              </Link>
            </div>
          </div>
        )}

        {/* Data Table */}
        {loading && !schema ? (
          <div className="h-64 rounded-2xl glass-panel animate-pulse" />
        ) : schema ? (
          <div className="space-y-4">
            <DynamicDataTable
              schema={schema}
              records={records}
              onRefresh={loadData}
              onFilterChange={(filters) => setActiveFilters(filters)}
            />

            {/* Ingest Record Modal */}
            <DynamicFormModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              schema={schema}
              onSuccess={loadData}
            />
          </div>
        ) : (
          <div className="p-8 text-center glass-panel rounded-2xl">
            <p className="text-xs font-bold text-rose-500">Collection schema not found.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
