"use client";

import React, { useEffect, useState } from "react";
import { CollectionRecord, CollectionSchema, SeoMetadata } from "@/models/collection.model";
import { updateCollectionRecordApi } from "@/api/collection.api";
import { SeoFormSection } from "@/components/collections/SeoFormSection";
import { useOlio } from "@/state/OlioProvider";

interface EditSeoModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: CollectionSchema;
  record: CollectionRecord | null;
  onSuccess: () => void;
}

export const EditSeoModal: React.FC<EditSeoModalProps> = ({
  isOpen,
  onClose,
  schema,
  record,
  onSuccess,
}) => {
  const { toast } = useOlio();
  const [seo, setSeo] = useState<SeoMetadata>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (record) {
      setSeo(record.data?.seo || {});
      setServerError(null);
    }
  }, [record]);

  if (!isOpen || !record) return null;

  const recordTitle = record.data?.title || record.data?.name || "Untitled Record";
  const recordSlug = record.data?.slug || "record-slug";

  const handleSaveSeo = async () => {
    setServerError(null);
    setSubmitting(true);

    // Merge existing record payload with updated SEO object
    const updatedData = {
      ...(record.data || {}),
      seo: seo,
    };

    const res = await updateCollectionRecordApi(schema.id, record.id, updatedData);
    setSubmitting(false);

    if (res.error) {
      setServerError(res.error);
      if (toast) toast.showToast(res.error, "error");
    } else {
      if (toast) toast.showToast(`SEO updated for "${recordTitle}"!`, "success");
      onSuccess();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[130] p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 flex items-center justify-center text-brand-500 border border-brand-500/20 shadow-sm">
              <i className="fa-solid fa-magnifying-glass-chart text-lg"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Edit SEO Metadata
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                  SEO Only
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Target Record: <span className="font-semibold text-slate-700 dark:text-slate-200">{recordTitle}</span>{" "}
                <code className="text-[11px] text-brand-600 dark:text-brand-400 font-mono">({recordSlug})</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Modal Body - Strictly SEO Fields */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-slate-950">
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation text-sm"></i>
              <span>{serverError}</span>
            </div>
          )}

          {/* Render ONLY the SEO Form Section */}
          <SeoFormSection
            seo={seo}
            onChange={setSeo}
            fallbackTitle={recordTitle}
            fallbackSlug={recordSlug}
            collectionSlug={schema.slug}
            projectId={schema.project_id}
            disabled={submitting}
            defaultExpanded={true}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveSeo}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
          >
            {submitting ? (
              <>
                <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                <span>Saving SEO...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk text-xs"></i>
                <span>Save SEO Metadata</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
