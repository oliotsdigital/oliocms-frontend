"use client";

import React, { useState } from "react";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import { deleteCollectionRecordApi } from "@/api/collection.api";

interface DynamicDataTableProps {
  schema: CollectionSchema;
  records: CollectionRecord[];
  onRefresh: () => void;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export const DynamicDataTable: React.FC<DynamicDataTableProps> = ({
  schema,
  records,
  onRefresh,
  onFilterChange,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<CollectionRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

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

      {/* Main Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/50 dark:border-slate-800/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Record ID</th>
                {schema.schema_definition.map((f) => (
                  <th key={f.name} className="py-3 px-4">
                    {f.label || f.name}
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
                    className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {row.id.substring(0, 8)}...
                    </td>

                    {/* Dynamic Columns */}
                    {schema.schema_definition.map((f) => {
                      const val = row.data?.[f.name];

                      if (val === undefined || val === null || val === "") {
                        return (
                          <td key={f.name} className="py-3 px-4 text-slate-400 italic">
                            —
                          </td>
                        );
                      }

                      if (f.type === "boolean") {
                        return (
                          <td key={f.name} className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1 ${
                                val
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  val ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              ></span>
                              {val ? "True" : "False"}
                            </span>
                          </td>
                        );
                      }

                      if (f.type === "number") {
                        return (
                          <td key={f.name} className="py-3 px-4 font-mono text-slate-900 dark:text-white">
                            {typeof val === "number" ? val.toLocaleString() : val}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={f.name}
                          className="py-3 px-4 text-slate-900 dark:text-white max-w-xs truncate"
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
                      <div className="flex items-center justify-end gap-2">
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
                    colSpan={schema.schema_definition.length + 3}
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
