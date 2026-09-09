"use client";

import React, { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import {
  fetchCollectionSchemaApi,
  fetchCollectionRecordsApi,
} from "@/api/collection.api";
import { DynamicDataTable } from "@/components/collections/DynamicDataTable";
import { Pagination, PAGE_SIZE_OPTIONS } from "@/components/collections/Pagination";
import { useOlio } from "@/state/OlioProvider";

const ImportDataModal = dynamic(
  () => import("@/components/collections/ImportDataModal").then((m) => m.ImportDataModal),
  { ssr: false }
);

interface CollectionDetailViewProps {
  collectionId: string;
}

const SEARCH_DEBOUNCE_MS = 350;

function isSameSchema(prev: CollectionSchema | null, next: CollectionSchema | null) {
  if (prev === next) return true;
  if (!prev || !next) return false;
  return prev.id === next.id && prev.updated_at === next.updated_at;
}

export const CollectionDetailView: React.FC<CollectionDetailViewProps> = ({ collectionId }) => {
  const { toast } = useOlio();
  const [schema, setSchema] = useState<CollectionSchema | null>(null);
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage((current) => (current === 1 ? current : 1));
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!collectionId) return;
    const signal = { cancelled: false };

    (async () => {
      const schemaData = await fetchCollectionSchemaApi(collectionId);
      if (signal.cancelled) return;
      setSchema((prev) => (isSameSchema(prev, schemaData) ? prev : schemaData));
    })();

    return () => {
      signal.cancelled = true;
    };
  }, [collectionId, refreshNonce]);

  useEffect(() => {
    if (!collectionId) return;
    const signal = { cancelled: false };

    (async () => {
      setLoading(true);
      const filterParams: Record<string, string> = { ...activeFilters };
      if (search.trim()) filterParams["search"] = search.trim();
      filterParams["limit"] = String(pageSize);
      filterParams["offset"] = String((page - 1) * pageSize);

      const res = await fetchCollectionRecordsApi(collectionId, filterParams);
      if (signal.cancelled) return;
      setRecords(res.data);
      setTotalRecords(res.total);
      setLoading(false);
    })();

    return () => {
      signal.cancelled = true;
    };
  }, [collectionId, search, activeFilters, page, pageSize, refreshNonce]);

  const handleSearchChange = useCallback((val: string) => {
    setSearchInput(val);
  }, []);

  const handleFilterChange = useCallback((filters: Record<string, string>) => {
    setActiveFilters(filters);
    setPage((current) => (current === 1 ? current : 1));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const handleOpenImport = useCallback(() => {
    setIsImportModalOpen(true);
  }, []);

  const handleCloseImport = useCallback(() => {
    setIsImportModalOpen(false);
  }, []);

  const handleExportData = useCallback(async () => {
    if (!schema || totalRecords === 0) {
      if (toast) toast.showToast("No records available to export", "error");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      let exportItems = records;
      if (totalRecords > records.length) {
        const fullRes = await fetchCollectionRecordsApi(collectionId, {
          limit: "1000",
          offset: "0",
          ...(search.trim() ? { search: search.trim() } : {}),
          ...activeFilters,
        });
        if (fullRes.data.length > 0) {
          exportItems = fullRes.data;
        }
      }

      const fields = schema.schema_definition || [];

      const rows = exportItems.map((r) => {
        const rowObj: Record<string, any> = {};

        if (fields.length > 0) {
          fields.forEach((f) => {
            const colName = f.label || f.name;
            const val = r.data?.[f.name];
            if (val === undefined || val === null) {
              rowObj[colName] = "";
            } else if (typeof val === "boolean") {
              rowObj[colName] = val ? "TRUE" : "FALSE";
            } else if (typeof val === "object") {
              rowObj[colName] = JSON.stringify(val);
            } else {
              rowObj[colName] = val;
            }
          });
        } else {
          Object.entries(r.data || {}).forEach(([k, v]) => {
            if (typeof v === "object" && v !== null) {
              rowObj[k] = JSON.stringify(v);
            } else {
              rowObj[k] = v ?? "";
            }
          });
        }

        rowObj["Created At"] = r.created_at ? new Date(r.created_at).toISOString() : "";
        return rowObj;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      if (rows.length > 0) {
        const colWidths = Object.keys(rows[0]).map((key) => {
          const maxLen = Math.max(
            key.length,
            ...rows.slice(0, 50).map((row) => String(row[key] || "").length)
          );
          return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
        });
        worksheet["!cols"] = colWidths;
      }

      const workbook = XLSX.utils.book_new();
      const sheetName = (schema.name || "Records")
        .substring(0, 31)
        .replace(/[\\/?*[\]:]/g, "");
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const fileName = `${schema.slug || "collection"}_export_${Date.now()}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      if (toast) {
        toast.showToast(`Exported ${rows.length} records to ${fileName}`, "success");
      }
    } catch (err) {
      console.error("Failed to export records as XLSX:", err);
      if (toast) toast.showToast("Failed to export records as Excel file", "error");
    }
  }, [schema, totalRecords, records, collectionId, search, activeFilters, toast]);

  return (
    <AppLayout pageTitle={schema ? schema.name : "Collection Details"}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/collections" className="hover:text-brand-500 transition">
              Collections
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-slate-900 dark:text-white font-bold">
              {schema ? schema.name : "Loading..."}
            </span>
            {schema && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 shrink-0 ${
                  schema.is_public !== false
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                }`}
              >
                <i className={`fa-solid ${schema.is_public !== false ? "fa-globe" : "fa-lock"} text-[8px]`}></i>
                {schema.is_public !== false ? "Public" : "Private"}
              </span>
            )}
          </div>

          {schema && (
            <div className="text-xs font-semibold text-slate-500">
              Total Entries: <strong className="text-slate-900 dark:text-white">{totalRecords}</strong>
            </div>
          )}
        </div>

        {schema && (
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {schema.is_public === false ? (
              <span
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm opacity-50 cursor-not-allowed select-none"
                title="This collection is Private. Public APIs are disabled."
              >
                <i className="fa-solid fa-lock text-xs"></i> Get APIs
              </span>
            ) : (
              <Link
                href={`/collections/${schema.id}/apis`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="View & test public REST APIs for this collection"
              >
                <i className="fa-solid fa-code text-xs text-brand-500"></i> Get APIs
              </Link>
            )}

            <button
              onClick={handleOpenImport}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Import Records from Excel (.xlsx, .xls) or CSV"
            >
              <i className="fa-solid fa-file-import text-xs text-brand-500"></i> Import Data
            </button>

            <button
              onClick={handleExportData}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Export Collection Records as Excel (.xlsx)"
            >
              <i className="fa-solid fa-file-excel text-xs text-brand-500"></i> Export Data (.xlsx)
            </button>

            <Link
              href={`/collections?id=${schema.id}`}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Edit Collection Schema & Fields"
            >
              <i className="fa-solid fa-pen-to-square text-xs text-brand-500"></i> Edit Collection
            </Link>

            <button
              onClick={handleRefresh}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Refresh Records"
            >
              <i className="fa-solid fa-arrows-rotate text-xs text-brand-500"></i> Refresh
            </button>

            <Link
              href={`/collections/${schema.id}/add-record`}
              className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition transform active:scale-95 flex items-center gap-2 shrink-0"
            >
              <i className="fa-solid fa-plus text-xs"></i> Add {schema.name}
            </Link>
          </div>
        )}

        {loading && !schema ? (
          <div className="h-64 rounded-2xl glass-panel animate-pulse" />
        ) : schema ? (
          <div className="space-y-4">
            <DynamicDataTable
              schema={schema}
              records={records}
              search={searchInput}
              onSearchChange={handleSearchChange}
              onRefresh={handleRefresh}
              onFilterChange={handleFilterChange}
            />

            <Pagination
              currentPage={page}
              totalItems={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={loading}
            />

            {isImportModalOpen && (
              <ImportDataModal
                isOpen
                onClose={handleCloseImport}
                schema={schema}
                onSuccess={handleRefresh}
              />
            )}
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
