"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOlio } from "@/state/OlioProvider";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionsApi, deleteCollectionSchemaApi } from "@/api/collection.api";
import { SchemaBuilderModal } from "@/components/collections/SchemaBuilderModal";

export default function CollectionsPage() {
  const { projectState } = useOlio();
  const selectedProject = projectState.selectedProject;
  const [collections, setCollections] = useState<CollectionSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const loadCollections = async () => {
    setLoading(true);
    const data = await fetchCollectionsApi(selectedProject?.id);
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, [selectedProject?.id]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete collection '${name}'?`)) return;

    await deleteCollectionSchemaApi(id);
    loadCollections();
  };

  const filtered = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout pageTitle="Dynamic Collections">
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-800/50 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-500 font-bold text-xs mb-3">
                <i className="fa-solid fa-cube text-[11px]"></i> Metadata-Driven JSONB Pattern
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Dynamic CMS Collections
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Define dynamic schema definitions on-the-fly without database migrations or dynamic DDL tables. Powered by GIN-indexed PostgreSQL JSONB documents.
              </p>
            </div>

            <button
              onClick={() => setIsBuilderOpen(true)}
              className="px-5 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-xl shadow-brand-500/25 transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0"
            >
              <i className="fa-solid fa-plus text-xs"></i>
              <span>Create Collection</span>
            </button>
          </div>
        </div>

        {/* Stats & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collections by name or slug..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-panel border border-slate-200/50 dark:border-slate-800/50 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Total Collections: <strong className="text-slate-900 dark:text-white">{collections.length}</strong></span>
          </div>
        </div>

        {/* Grid View of Collection Schemas */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-48 rounded-2xl glass-panel animate-pulse p-5 flex flex-col justify-between"
              />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.id}`}
                className="group glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 hover:border-brand-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
                      <i className="fa-solid fa-table-cells"></i>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, col.id, col.name)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      title="Delete Collection Schema"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 group-hover:text-brand-500 transition">
                    {col.name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                    /{col.slug}
                  </p>

                  {/* Schema Field Badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {col.schema_definition.map((f) => (
                      <span
                        key={f.name}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40"
                      >
                        {f.name} <span className="opacity-50 font-normal">({f.type})</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-200/30 dark:border-slate-800/30 flex items-center justify-between text-xs font-semibold text-brand-500">
                  <span>View Records & Data</span>
                  <i className="fa-solid fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl p-12 text-center border border-slate-200/50 dark:border-slate-800/50">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-2xl mb-4">
              <i className="fa-solid fa-database"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Collections Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Get started by creating your first dynamic collection schema. Define custom fields and ingest records immediately.
            </p>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="mt-5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition"
            >
              <i className="fa-solid fa-plus text-xs mr-1.5"></i> Create Collection
            </button>
          </div>
        )}

        {/* Schema Builder Modal */}
        <SchemaBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          onSuccess={loadCollections}
        />
      </div>
    </AppLayout>
  );
}
