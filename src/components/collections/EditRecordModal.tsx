"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { CollectionRecord, CollectionSchema } from "@/models/collection.model";
import { updateCollectionRecordApi } from "@/api/collection.api";
import { MediaFieldInput } from "./MediaFieldInput";
import { useOlio } from "@/state/OlioProvider";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: CollectionSchema;
  record: CollectionRecord | null;
  onSuccess: () => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  schema,
  record,
  onSuccess,
}) => {
  const { toast } = useOlio();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<Record<string, any>>({
    defaultValues: record?.data || {},
  });

  // Reset form with current record data when record changes
  useEffect(() => {
    if (record) {
      const initialVals: Record<string, any> = {};
      schema.schema_definition.forEach((f) => {
        const val = record.data?.[f.name];
        if (f.type === "boolean") {
          initialVals[f.name] = Boolean(val);
        } else {
          initialVals[f.name] = val !== undefined && val !== null ? val : "";
        }
      });
      reset(initialVals);
      setServerError(null);
    }
  }, [record, schema, reset]);

  if (!isOpen || !record) return null;

  const onSubmit = async (formData: Record<string, any>) => {
    setServerError(null);
    setSubmitting(true);

    // Clean payload numbers, booleans & media
    const cleanedData: Record<string, any> = {};
    schema.schema_definition.forEach((f) => {
      const val = formData[f.name];
      if (f.type === "number") {
        cleanedData[f.name] = val !== "" && val !== null && !isNaN(Number(val)) ? Number(val) : null;
      } else if (f.type === "boolean") {
        cleanedData[f.name] = Boolean(val);
      } else if (f.type === "media") {
        cleanedData[f.name] = val && typeof val === "string" && val.trim() ? val.trim() : null;
      } else {
        cleanedData[f.name] = val !== undefined ? val : null;
      }
    });

    const res = await updateCollectionRecordApi(schema.id, record.id, cleanedData);
    setSubmitting(false);

    if (res.error) {
      setServerError(res.error);
      if (toast) toast.showToast(res.error, "error");
    } else {
      if (toast) toast.showToast(`${schema.name} record updated successfully!`, "success");
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-pen-to-square text-brand-500"></i>
              Edit Record: <span className="text-brand-500">{schema.name}</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Record ID: {record.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {serverError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-sm"></i>
            <span>{serverError}</span>
          </div>
        )}

        {/* Dynamic Form Controls */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 flex-1 overflow-y-auto pr-1">
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
                    placeholder={field.name === "slug" ? "auto-generated-slug" : `Enter ${field.label || field.name}...`}
                    className={`w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition ${
                      field.name === "slug" ? "font-mono" : ""
                    }`}
                  />
                ) : field.type === "password" ? (
                  <input
                    type="password"
                    {...register(field.name, {
                      required: field.validation?.required ? `${field.label || field.name} is required` : false,
                    })}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                ) : field.type === "richtext" || field.type === "markdown" || field.type === "json" ? (
                  <textarea
                    rows={4}
                    {...register(field.name, {
                      required: field.validation?.required ? `${field.label || field.name} is required` : false,
                    })}
                    placeholder={field.type === "json" ? '{\n  "key": "value"\n}' : `Write ${field.label || field.name}...`}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    step="any"
                    {...register(field.name, {
                      required: field.validation?.required ? `${field.label || field.name} is required` : false,
                    })}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                ) : field.type === "date" ? (
                  <input
                    type="date"
                    {...register(field.name, {
                      required: field.validation?.required ? `${field.label || field.name} is required` : false,
                    })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                ) : field.type === "boolean" ? (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className={`flex items-center gap-3 px-3.5 py-2 rounded-xl border text-xs font-semibold transition ${
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
                ) : field.type === "media" ? (
                  <Controller
                    name={field.name}
                    control={control}
                    rules={{
                      required: field.validation?.required ? `${field.label || field.name} is required` : false,
                    }}
                    render={({ field: { value, onChange } }) => (
                      <MediaFieldInput
                        field={field}
                        value={value}
                        onChange={onChange}
                        projectId={schema.project_id}
                        disabled={submitting}
                      />
                    )}
                  />
                ) : (
                  <input
                    type="text"
                    {...register(field.name)}
                    placeholder={`Enter ${field.label || field.name}...`}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
                  />
                )}

                {fieldError && (
                  <p className="text-[11px] text-rose-500 font-medium">{fieldError}</p>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i> Updating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i> Update {schema.name}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
