"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import {
  fetchCollectionSchemaApi,
  fetchCollectionRecordsApi,
  createCollectionRecordApi,
} from "@/api/collection.api";
import { DynamicFormModal } from "@/components/collections/DynamicFormModal";
import { ImportDataModal } from "@/components/collections/ImportDataModal";
import { DynamicDataTable } from "@/components/collections/DynamicDataTable";
import { Pagination } from "@/components/collections/Pagination";
import { useOlio } from "@/state/OlioProvider";
import * as XLSX from "xlsx";

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
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const loadData = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!collectionId) return;
    setLoading(true);
    const schemaData = await fetchCollectionSchemaApi(collectionId);
    if (signal?.cancelled) return;
    setSchema(schemaData);

    if (schemaData) {
      const filterParams: Record<string, string> = { ...activeFilters };
      if (search.trim()) filterParams["search"] = search.trim();
      filterParams["limit"] = String(pageSize);
      filterParams["offset"] = String((page - 1) * pageSize);

      const res = await fetchCollectionRecordsApi(collectionId, filterParams);
      if (signal?.cancelled) return;
      setRecords(res.data);
      setTotalRecords(res.total);
    }
    setLoading(false);
  }, [collectionId, search, activeFilters, page, pageSize]);

  useEffect(() => {
    const signal = { cancelled: false };
    loadData(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [loadData]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters(filters);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleExportData = async () => {
    if (!schema || totalRecords === 0) {
      if (toast) toast.showToast("No records available to export", "error");
      return;
    }

    try {
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

      // Build tabular data rows for XLSX export
      const rows = exportItems.map((r) => {
        const rowObj: Record<string, any> = {};

        if (fields.length > 0) {
          fields.forEach((f) => {
            const colName = f.label || f.name;
            let val = r.data?.[f.name];
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

        // Include creation date
        rowObj["Created At"] = r.created_at ? new Date(r.created_at).toISOString() : "";
        return rowObj;
      });

      // Create sheet from tabular rows
      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
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
              Total Entries: <strong className="text-slate-900 dark:text-white">{totalRecords}</strong>
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search ${schema.name} records...`}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <Link
                href={`/collections/${schema.id}/apis`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 border border-brand-500/20 transition text-xs font-bold flex items-center gap-1.5 shadow-sm"
                title="View & test public REST APIs for this collection"
              >
                <i className="fa-solid fa-code text-xs text-brand-500"></i> Get APIs
              </Link>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Import Records from Excel (.xlsx, .xls) or CSV"
              >
                <i className="fa-solid fa-file-import text-xs"></i> Import Data
              </button>

              <button
                onClick={handleExportData}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Export Collection Records as Excel (.xlsx)"
              >
                <i className="fa-solid fa-file-excel text-xs text-emerald-500"></i> Export Data (.xlsx)
              </button>

              <Link
                href={`/collections?id=${schema.id}`}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-brand-500 transition text-xs font-bold flex items-center gap-1.5"
                title="Edit Collection Schema & Fields"
              >
                <i className="fa-solid fa-pen-to-square text-xs"></i> Edit Collection
              </Link>

              <button
                onClick={() => loadData()}
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
              onRefresh={() => loadData()}
              onFilterChange={handleFilterChange}
            />

            {/* Pagination Controls */}
            <Pagination
              currentPage={page}
              totalItems={totalRecords}
              pageSize={pageSize}
              pageSizeOptions={[10, 25, 50, 100]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={loading}
            />

            {/* Ingest Record Modal */}
            <DynamicFormModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              schema={schema}
              onSuccess={() => loadData()}
            />

            {/* Import Data Modal (XLSX / CSV Column Mapping) */}
            <ImportDataModal
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              schema={schema}
              onSuccess={() => loadData()}
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
