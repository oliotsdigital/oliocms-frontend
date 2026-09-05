"use client";

import React, { useMemo, useState } from "react";
import { CollectionRecord, CollectionSchema, FieldDefinition } from "@/models/collection.model";
import { deleteCollectionRecordApi } from "@/api/collection.api";
import { resolveMediaUrl } from "@/utils/media";
import { EditRecordModal } from "./EditRecordModal";
import { useOlio } from "@/state/OlioProvider";

interface DynamicDataTableProps {
  schema: CollectionSchema;
  records: CollectionRecord[];
  onRefresh: () => void;
  onFilterChange?: (filters: Record<string, string>) => void;
}

interface DisplayColumn {
  key: string;
  label: string;
  field?: FieldDefinition;
  isVirtualMedia?: boolean;
}

export const DynamicDataTable: React.FC<DynamicDataTableProps> = ({
  schema,
  records,
  onRefresh,
  onFilterChange,
}) => {
  const { toast } = useOlio();
  const [selectedRecord, setSelectedRecord] = useState<CollectionRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<CollectionRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const isAllSelected = records.length > 0 && selectedIds.length === records.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < records.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map((r) => r.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedIds.length} selected record${
          selectedIds.length > 1 ? "s" : ""
        }? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        selectedIds.map((id) => deleteCollectionRecordApi(schema.id, id))
      );
      const successCount = results.filter((r) => r.success).length;
      if (toast) {
        toast.showToast(
          `Successfully deleted ${successCount} of ${selectedIds.length} record${
            selectedIds.length > 1 ? "s" : ""
          }!`,
          "success"
        );
      }
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      if (toast) toast.showToast("Failed to delete records. Please try again.", "error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Tabular columns: Media, Title, Slug (Created At and Actions are fixed columns)
  const displayColumns = useMemo<DisplayColumn[]>(() => {
    const fields = schema.schema_definition || [];

    // 1. Media field
    const mediaField = fields.find(
      (f) => f.type === "media" || f.name.toLowerCase() === "media" || f.name.toLowerCase().includes("media")
    );

    // 2. Title field
    const titleField = fields.find((f) => {
      const nameLower = f.name.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();
      return (
        nameLower === "title" ||
        nameLower === "name" ||
        labelLower === "title" ||
        labelLower === "name" ||
        nameLower.includes("title") ||
        labelLower.includes("title")
      );
    });

    // 3. Slug field
    const slugField = fields.find((f) => {
      const nameLower = f.name.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();
      return nameLower === "slug" || labelLower === "slug" || nameLower.includes("slug");
    });

    const cols: DisplayColumn[] = [];

    // Media column
    if (mediaField) {
      cols.push({
        key: mediaField.name,
        label: mediaField.label || "Media",
        field: mediaField,
      });
    } else {
      cols.push({
        key: "media",
        label: "Media",
        field: { name: "media", label: "Media", type: "media" },
      });
    }

    // Title column
    if (titleField) {
      cols.push({
        key: titleField.name,
        label: titleField.label || "Title",
        field: titleField,
      });
    } else {
      cols.push({
        key: "title",
        label: "Title",
        field: { name: "title", label: "Title", type: "string" },
      });
    }

    // Slug column
    if (slugField) {
      cols.push({
        key: slugField.name,
        label: slugField.label || "Slug",
        field: slugField,
      });
    } else {
      cols.push({
        key: "slug",
        label: "Slug",
        field: { name: "slug", label: "Slug", type: "string" },
      });
    }

    return cols;
  }, [schema.schema_definition]);

  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setDeletingId(recordId);
    await deleteCollectionRecordApi(schema.id, recordId);
    setDeletingId(null);
    onRefresh();
  };

  const handleLocalFilterChange = (key: string, val: string) => {
    const updated = { ...filterValues, [key]: val };
    if (!val) delete updated[key];
    setFilterValues(updated);
    if (onFilterChange) onFilterChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Inline Filter Controls Bar */}
      <div className="p-3 rounded-2xl glass-panel border border-slate-200/50 dark:border-slate-800/50 flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <i className="fa-solid fa-filter text-brand-500"></i> Dynamic Filters:
        </span>

        {schema.schema_definition.map((f) => {
          if (f.type === "boolean") {
            return (
              <select
                key={f.name}
                value={filterValues[f.name] || ""}
                onChange={(e) => handleLocalFilterChange(f.name, e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="">All ({f.label || f.name})</option>
                <option value="true">{f.label || f.name}: True</option>
                <option value="false">{f.label || f.name}: False</option>
              </select>
            );
          } else if (f.type === "number") {
            return (
              <input
                key={f.name}
                type="number"
                placeholder={`Min ${f.label || f.name}`}
                value={filterValues[`${f.name}__gte`] || ""}
                onChange={(e) => handleLocalFilterChange(`${f.name}__gte`, e.target.value)}
                className="w-32 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              />
            );
          }
          return null;
        })}

        {Object.keys(filterValues).length > 0 && (
          <button
            onClick={() => {
              setFilterValues({});
              if (onFilterChange) onFilterChange({});
            }}
            className="text-xs text-rose-500 hover:underline font-semibold ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="glass-panel rounded-2xl p-3.5 border border-brand-500/40 bg-brand-500/10 dark:bg-brand-500/15 shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-lg bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm">
              <i className="fa-solid fa-check"></i>
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 transition"
            >
              Deselect all
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md shadow-rose-500/25 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isBulkDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-trash-can text-xs"></i>
                  <span>Delete Selected ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/50 dark:border-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {/* Select All Checkbox */}
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={handleSelectAll}
                    disabled={records.length === 0 || isBulkDeleting}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500 cursor-pointer disabled:opacity-40"
                    title={isAllSelected ? "Deselect All" : "Select All"}
                  />
                </th>
                {displayColumns.map((col) => (
                  <th key={col.key} className="py-3 px-4">
                    {col.label}
                  </th>
                ))}
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/40 text-xs font-medium">
              {records.length > 0 ? (
                records.map((row) => (
                  <tr
                    key={row.id}
                    className={`transition ${
                      selectedIds.includes(row.id)
                        ? "bg-brand-500/10 dark:bg-brand-500/20 hover:bg-brand-500/15"
                        : "hover:bg-slate-100/50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Row Select Checkbox */}
                    <td className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => handleToggleSelect(row.id)}
                        disabled={isBulkDeleting}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                    </td>
                    {/* Columns rendered: Media, Title, Slug */}
                    {displayColumns.map((col) => {
                      const f = col.field || { name: col.key, label: col.label, type: "string" as const };
                      let val = row.data?.[f.name];

                      // Fallback checks for standard field names
                      if (val === undefined || val === null || val === "") {
                        if (col.key.toLowerCase().includes("slug")) {
                          val = row.data?.slug;
                        } else if (col.key.toLowerCase().includes("title") || col.key.toLowerCase().includes("name")) {
                          val = row.data?.title || row.data?.name;
                        } else if (col.key.toLowerCase().includes("media") || f.type === "media") {
                          val = row.data?.media || row.data?.featured_image || row.data?.image;
                        }
                      }

                      if (val === undefined || val === null || val === "") {
                        return (
                          <td key={col.key} className="py-3 px-4 text-slate-400 italic">
                            —
                          </td>
                        );
                      }

                      if (f.type === "media" || col.key.toLowerCase().includes("media")) {
                        const strVal = String(val);
                        const mediaUrl = resolveMediaUrl(strVal);
                        const isImg =
                          strVal.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i) ||
                          strVal.startsWith("data:image/") ||
                          strVal.includes("images.unsplash.com");

                        return (
                          <td key={col.key} className="py-2 px-4">
                            {isImg ? (
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-9 h-9 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm hover:border-brand-500/50 hover:shadow-md transition inline-flex"
                                title={strVal}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={mediaUrl}
                                  alt={f.label || f.name}
                                  className="w-full h-full object-cover transition group-hover:scale-110"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              </a>
                            ) : (
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 hover:border-brand-500/50 transition inline-flex"
                                title={strVal}
                              >
                                <i className="fa-solid fa-file text-sm"></i>
                              </a>
                            )}
                          </td>
                        );
                      }

                      if (col.key.toLowerCase().includes("slug") || f.name.toLowerCase().includes("slug")) {
                        return (
                          <td
                            key={col.key}
                            className="py-3 px-4 max-w-xs truncate"
                            title={String(val)}
                          >
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              /{String(val).replace(/^\/+/, "")}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          className="py-3 px-4 text-slate-900 dark:text-white font-semibold max-w-xs truncate"
                          title={String(val)}
                        >
                          {String(val)}
                        </td>
                      );
                    })}

                    {/* Created At */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingRecord(row)}
                          className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 hover:bg-brand-500/10 transition"
                          title="Edit Record"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button
                          onClick={() => setSelectedRecord(row)}
                          className="p-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 transition"
                          title="View Raw JSON"
                        >
                          <i className="fa-solid fa-code text-xs"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          disabled={deletingId === row.id}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                          title="Delete Record"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={displayColumns.length + 3}
                    className="py-12 text-center text-slate-400"
                  >
                    <i className="fa-solid fa-folder-open text-3xl mb-2 block"></i>
                    <p className="text-xs font-semibold">No records found in this collection.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Record Modal */}
      {editingRecord && (
        <EditRecordModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          schema={schema}
          record={editingRecord}
          onSuccess={onRefresh}
        />
      )}

      {/* JSON Inspector Modal Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[130] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/40 dark:border-slate-800/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <i className="fa-solid fa-code text-brand-500"></i> Record JSON Document
              </h4>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
              <pre>{JSON.stringify(selectedRecord.data, null, 2)}</pre>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-brand-500 hover:text-white transition"
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
