"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import {
  fetchCollectionSchemaApi,
  fetchCollectionRecordsApi,
} from "@/api/collection.api";
import { DynamicFormModal } from "@/components/collections/DynamicFormModal";
import { DynamicDataTable } from "@/components/collections/DynamicDataTable";

interface CollectionDetailViewProps {
  collectionId: string;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ collectionId }) => {
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

  return (
    <AppLayout pageTitle={schema ? schema.name : "Collection Details"}>
      <div className="space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/collections" className="hover:text-brand-500 transition">
            Collections
          </Link>
          <i className="fa-solid fa-chevron-right text-[10px]"></i>
          <span className="text-slate-900 dark:text-white font-bold">
            {schema ? schema.name : "Loading..."}
          </span>
        </div>

        {/* Header Summary */}
        {schema && (
          <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 text-[10px] font-bold uppercase tracking-wider">
                  JSONB Collection
                </span>
                <span className="text-xs font-mono text-slate-400">/{schema.slug}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {schema.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Schema Definition: {schema.schema_definition.length} dynamic properties defined.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Refresh Records"
              >
                <i className="fa-solid fa-arrows-rotate text-xs"></i> Refresh
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
              >
                <i className="fa-solid fa-plus text-xs"></i> Ingest Record
              </button>
            </div>
          </div>
        )}

        {/* Records Filter & Data Table */}
        {loading && !schema ? (
          <div className="h-64 rounded-2xl glass-panel animate-pulse" />
        ) : schema ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${schema.name} records...`}
                  className="w-full pl-10 pr-4 py-2 rounded-xl glass-panel border border-slate-200/50 dark:border-slate-800/50 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="text-xs font-semibold text-slate-500">
                Total Entries: <strong className="text-slate-900 dark:text-white">{records.length}</strong>
              </div>
            </div>

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
