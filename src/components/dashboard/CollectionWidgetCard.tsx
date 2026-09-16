"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { CollectionSchema, CollectionRecord, FieldDefinition } from "@/models/collection.model";
import { DashboardWidget } from "@/models/widget.model";
import { fetchCollectionRecordsApi } from "@/api/collection.api";

interface CollectionWidgetCardProps {
  widget: DashboardWidget;
  collection: CollectionSchema;
  onRemove: (widgetId: string) => void;
}

export const CollectionWidgetCard: React.FC<CollectionWidgetCardProps> = React.memo(function CollectionWidgetCard({
  widget,
  collection,
  onRemove,
}) {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter out any media/image columns
  const displayColumns = useMemo(() => {
    return (collection.schema_definition || []).filter((f: FieldDefinition) => {
      const type = (f.type || "").toLowerCase();
      const name = (f.name || "").toLowerCase();
      return (
        type !== "media" &&
        name !== "media" &&
        name !== "image" &&
        name !== "featured_image"
      );
    });
  }, [collection.schema_definition]);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchCollectionRecordsApi(widget.collectionId, {
        limit: String(widget.limit),
      });
      setRecords(res.data || []);
      setTotalRecords(res.total || 0);
    } catch {
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [widget.collectionId, widget.limit]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Width classes
  const widthClass = useMemo(() => {
    switch (widget.width) {
      case "1/3":
        return "col-span-12 lg:col-span-4";
      case "2/3":
        return "col-span-12 lg:col-span-8";
      case "3/3":
      default:
        return "col-span-12";
    }
  }, [widget.width]);

  const renderCellValue = (record: CollectionRecord, col: FieldDefinition) => {
    const rawVal = record.data?.[col.name];
    if (rawVal === undefined || rawVal === null || rawVal === "") {
      return <span className="text-slate-400 dark:text-slate-600 font-mono text-[10px]">—</span>;
    }

    if (typeof rawVal === "boolean") {
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
            rawVal
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
          }`}
        >
          {rawVal ? "True" : "False"}
        </span>
      );
    }

    if (col.type === "date") {
      try {
        return new Date(rawVal).toLocaleDateString();
      } catch {
        return String(rawVal);
      }
    }

    if (typeof rawVal === "object") {
      return (
        <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px] block" title={JSON.stringify(rawVal)}>
          {JSON.stringify(rawVal)}
        </span>
      );
    }

    return (
      <span className="truncate max-w-[160px] block" title={String(rawVal)}>
        {String(rawVal)}
      </span>
    );
  };

  return (
    <div
      className={`${widthClass} glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-md flex flex-col justify-between transition hover:shadow-lg`}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200/40 dark:border-slate-800/40 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 flex items-center justify-center shrink-0">
              <i className={`fa-solid ${collection.icon || "fa-cube"} text-xs`}></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {collection.name}
                </h4>
                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-mono text-slate-500 font-semibold shrink-0">
                  {widget.width}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                /{collection.slug} • Showing up to {widget.limit} records
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={loadRecords}
              disabled={isLoading}
              className="w-7 h-7 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition disabled:opacity-50"
              title="Refresh records"
            >
              <i className={`fa-solid fa-arrows-rotate text-[10px] ${isLoading ? "animate-spin text-brand-500" : ""}`}></i>
            </button>

            <Link
              href={`/collections/${collection.id}`}
              className="w-7 h-7 rounded-lg glass-card flex items-center justify-center text-slate-400 hover:text-brand-500 transition"
              title="View full collection records"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
            </Link>

            <button
              type="button"
              onClick={() => onRemove(widget.id)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition flex items-center justify-center"
              title="Remove widget from dashboard"
            >
              <i className="fa-solid fa-xmark text-xs"></i>
            </button>
          </div>
        </div>

        {/* Tabular Records View */}
        {isLoading ? (
          <div className="space-y-2 py-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-8 rounded-xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
            ))}
          </div>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200/50 dark:border-slate-800/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800/60">
                  {displayColumns.map((col) => (
                    <th
                      key={col.name}
                      className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {col.label || col.name}
                    </th>
                  ))}
                  <th className="py-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right whitespace-nowrap">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {records.map((rec) => (
                  <tr
                    key={rec.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition text-slate-800 dark:text-slate-200"
                  >
                    {displayColumns.map((col) => (
                      <td key={col.name} className="py-2 px-3 text-xs">
                        {renderCellValue(rec, col)}
                      </td>
                    ))}
                    <td className="py-2 px-3 text-[10px] text-slate-400 font-mono text-right whitespace-nowrap">
                      {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/40 space-y-1">
            <i className="fa-solid fa-inbox text-slate-400 text-lg"></i>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              No records found
            </p>
            <p className="text-[11px] text-slate-400">
              This collection currently has 0 entries.
            </p>
          </div>
        )}
      </div>

      {/* Footer Details */}
      <div className="pt-3 mt-3 border-t border-slate-200/30 dark:border-slate-800/30 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Total entries: <strong className="text-slate-700 dark:text-slate-300">{totalRecords}</strong>
        </span>
        <Link
          href={`/collections/${collection.id}`}
          className="text-brand-500 hover:text-brand-600 font-bold transition flex items-center gap-1"
        >
          <span>Open Collection</span>
          <i className="fa-solid fa-chevron-right text-[9px]"></i>
        </Link>
      </div>
    </div>
  );
});
