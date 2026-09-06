"use client";

import React, { useEffect, useState } from "react";
import { FieldDefinition, CollectionRecord, CollectionSchema } from "@/models/collection.model";
import { fetchCollectionRecordsApi, fetchCollectionSchemaApi } from "@/api/collection.api";
import { useOlio } from "@/state/OlioProvider";

interface EnumerationFieldInputProps {
  field: FieldDefinition;
  value?: string | null;
  onChange: (val: string) => void;
  projectId?: string;
  disabled?: boolean;
}

export const EnumerationFieldInput: React.FC<EnumerationFieldInputProps> = ({
  field,
  value,
  onChange,
  projectId,
  disabled = false,
}) => {
  const { collectionsState } = useOlio();
  const targetCollectionId = field.validation?.target_collection_id;

  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [targetCollection, setTargetCollection] = useState<CollectionSchema | null>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!targetCollectionId) {
      setRecords([]);
      setTargetCollection(null);
      return;
    }

    // 1. Locate schema from state or API
    const found = collectionsState.collections.find((c) => c.id === targetCollectionId);
    if (found) {
      setTargetCollection(found);
    } else {
      fetchCollectionSchemaApi(targetCollectionId, projectId).then((col) => {
        if (!isCancelled && col) {
          setTargetCollection(col);
        }
      });
    }

    // 2. Fetch records for the target collection
    setLoading(true);
    fetchCollectionRecordsApi(targetCollectionId, { limit: "100" })
      .then((res) => {
        if (!isCancelled) {
          setRecords(res.data || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRecords([]);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [targetCollectionId, projectId, collectionsState.collections]);

  const targetName = targetCollection?.name || "Collection";

  // If no target collection is linked to this enumeration property
  if (!targetCollectionId) {
    return (
      <div className="space-y-1">
        <input
          type="text"
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Enter ${field.label || field.name}...`}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
        />
        <p className="text-[10px] text-amber-500 flex items-center gap-1">
          <i className="fa-solid fa-triangle-exclamation"></i>
          No collection linked to this Enumeration property. You can link one in the Collection Schema Studio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition appearance-none cursor-pointer pr-10 shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <option value="" disabled>
              Loading options from {targetName}...
            </option>
          ) : records.length === 0 ? (
            <option value="" disabled>
              -- No records found in {targetName} --
            </option>
          ) : (
            <option value="">
              -- Select {field.label || field.name} ({targetName}) --
            </option>
          )}

          {records.map((r) => {
            const label =
              r.data?.title ||
              r.data?.name ||
              r.data?.label ||
              r.data?.slug ||
              `Item #${r.id.slice(0, 6)}`;
            const optVal =
              r.data?.title ||
              r.data?.name ||
              r.data?.slug ||
              r.id;

            return (
              <option key={r.id} value={optVal}>
                {label}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin text-xs"></i>
          ) : (
            <i className="fa-solid fa-chevron-down text-xs"></i>
          )}
        </div>
      </div>

      {/* Target Collection Info Tag */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span className="flex items-center gap-1">
          <i className="fa-solid fa-layer-group text-purple-500 text-[10px]"></i>
          <span>Options sourced from:</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {targetName}
          </span>
          {targetCollection?.slug && (
            <span className="font-mono text-[10px] opacity-70">
              (/{targetCollection.slug})
            </span>
          )}
        </span>

        {records.length > 0 && (
          <span className="text-[10px] text-slate-400">
            {records.length} {records.length === 1 ? "value" : "values"}
          </span>
        )}
      </div>
    </div>
  );
};
