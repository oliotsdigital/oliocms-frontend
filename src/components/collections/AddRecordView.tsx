"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionSchemaApi, createCollectionRecordApi } from "@/api/collection.api";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOlio } from "@/state/OlioProvider";

interface AddRecordViewProps {
  collectionId: string;
}

export const AddRecordView: React.FC<AddRecordViewProps> = ({ collectionId }) => {
  const router = useRouter();
  const { toast } = useOlio();
  const [schema, setSchema] = useState<CollectionSchema | null>(null);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Record<string, any>>();

  useEffect(() => {
    if (!collectionId) return;

    let cancelled = false;

    async function loadSchema() {
      setLoadingSchema(true);
      const data = await fetchCollectionSchemaApi(collectionId);
      if (cancelled) return;
      setSchema(data);
      setLoadingSchema(false);
    }

    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  const onSubmit = async (formData: Record<string, any>) => {
    if (!schema) return;
    setServerError(null);
    setSubmitting(true);

    // Clean payload numbers & booleans
    const cleanedData: Record<string, any> = {};
    schema.schema_definition.forEach((f) => {
      const val = formData[f.name];
      if (f.type === "number") {
        cleanedData[f.name] = val !== "" && val !== null && !isNaN(Number(val)) ? Number(val) : null;
      } else if (f.type === "boolean") {
        cleanedData[f.name] = Boolean(val);
      } else {
        cleanedData[f.name] = val !== undefined ? val : null;
      }
    });

    const res = await createCollectionRecordApi(schema.id, cleanedData);
    setSubmitting(false);

    if (res.error) {
      setServerError(res.error);
      if (toast) toast.showToast(res.error, "error");
    } else {
      if (toast) toast.showToast(`New ${schema.name} record added successfully!`, "success");
      router.push(`/collections/${schema.id}`);
    }
  };

  return (
    <AppLayout pageTitle={schema ? `Add ${schema.name} Record` : "Add Record"}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/collections" className="hover:text-brand-500 transition">
              Collections
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            {schema ? (
              <Link href={`/collections/${schema.id}`} className="hover:text-brand-500 transition">
                {schema.name}
              </Link>
            ) : (
              <span>Loading...</span>
            )}
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-slate-900 dark:text-white font-bold">
              Add {schema ? schema.name : "Record"}
            </span>
          </div>

          {schema && (
            <Link
              href={`/collections/${schema.id}`}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-xs"></i> Back to Records
            </Link>
          )}
        </div>

        {/* Loading State */}
        {loadingSchema ? (
          <div className="h-96 rounded-3xl glass-panel animate-pulse" />
        ) : schema ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Main Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Dynamic Fields (2 Cols wide) */}
              <div className="lg:col-span-2 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
                <div className="pb-4 border-b border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <i className={`fa-solid ${schema.icon || "fa-cube"} text-brand-500`}></i>
                      Entry Content: <span className="text-brand-500">{schema.name}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Fill in the schema fields defined for this dynamic collection
                    </p>
                  </div>
                </div>

                {serverError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-sm"></i>
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Render Fields */}
                <div className="space-y-5">
                  {schema.schema_definition.map((field) => {
                    const fieldError = errors[field.name]?.message as string | undefined;

                    return (
                      <div key={field.name} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          {field.label || field.name}
                          {field.validation?.required && <span className="text-rose-500 ml-1">*</span>}
                          <span className="ml-2 text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                            ({field.type})
                          </span>
                        </label>

                        {field.type === "string" || field.type === "relation" || field.type === "email" || field.type === "uid" ? (
                          <input
                            type={field.type === "email" ? "email" : "text"}
                            {...register(field.name, {
                              required: field.validation?.required ? `${field.label || field.name} is required` : false,
                            })}
                            placeholder={`Enter ${field.label || field.name}...`}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        ) : field.type === "password" ? (
                          <input
                            type="password"
                            {...register(field.name, {
                              required: field.validation?.required ? `${field.label || field.name} is required` : false,
                            })}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        ) : field.type === "richtext" || field.type === "markdown" || field.type === "json" ? (
                          <textarea
                            rows={5}
                            {...register(field.name, {
                              required: field.validation?.required ? `${field.label || field.name} is required` : false,
                            })}
                            placeholder={field.type === "json" ? '{\n  "key": "value"\n}' : `Write ${field.label || field.name} content...`}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        ) : field.type === "number" ? (
                          <input
                            type="number"
                            step="any"
                            {...register(field.name, {
                              required: field.validation?.required ? `${field.label || field.name} is required` : false,
                            })}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        ) : field.type === "date" ? (
                          <input
                            type="date"
                            {...register(field.name, {
                              required: field.validation?.required ? `${field.label || field.name} is required` : false,
                            })}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        ) : field.type === "boolean" ? (
                          <Controller
                            name={field.name}
                            control={control}
                            render={({ field: { value, onChange } }) => (
                              <button
                                type="button"
                                onClick={() => onChange(!value)}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-semibold transition ${
                                  value
                                    ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                    : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                                }`}
                              >
                                <div
                                  className={`w-8 h-4 rounded-full p-0.5 transition ${
                                    value ? "bg-emerald-500" : "bg-slate-400"
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full bg-white transition-transform ${
                                      value ? "translate-x-4" : "translate-x-0"
                                    }`}
                                  />
                                </div>
                                <span>{value ? "Enabled (True)" : "Disabled (False)"}</span>
                              </button>
                            )}
                          />
                        ) : (
                          <input
                            type="text"
                            {...register(field.name)}
                            placeholder={`Enter ${field.label || field.name}...`}
                            className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                          />
                        )}

                        {fieldError && (
                          <p className="text-[11px] text-rose-500 font-medium">{fieldError}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Actions Sidebar Card */}
              <div className="space-y-6">
                <div className="glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-5">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
                    Entry Actions
                  </h3>

                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      {submitting ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin text-xs"></i> Saving {schema.name}...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-check text-xs"></i> Add {schema.name}
                        </>
                      )}
                    </button>

                    <Link
                      href={`/collections/${schema.id}`}
                      className="w-full block text-center py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700"
                    >
                      Cancel
                    </Link>
                  </div>

                  <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <p>
                      <strong>Schema:</strong> {schema.name}
                    </p>
                    <p>
                      <strong>Slug:</strong> /{schema.slug}
                    </p>
                    <p>
                      <strong>Fields:</strong> {schema.schema_definition.length} properties
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-8 text-center glass-panel rounded-3xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500">Collection schema not found.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
