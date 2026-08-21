"use client";

import React, { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CollectionSchema } from "@/models/collection.model";
import { createCollectionRecordApi } from "@/api/collection.api";

interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: CollectionSchema;
  onSuccess: () => void;
}

export const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  isOpen,
  onClose,
  schema,
  onSuccess,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Dynamically generate Zod validation schema from collection metadata
  const dynamicZodSchema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};

    schema.schema_definition.forEach((field) => {
      const isRequired = field.validation?.required;

      if (field.type === "string" || field.type === "relation") {
        let strSchema = z.string();
        if (isRequired) {
          shape[field.name] = strSchema.min(1, `${field.label || field.name} is required.`);
        } else {
          shape[field.name] = strSchema.optional().or(z.literal(""));
        }
      } else if (field.type === "number") {
        if (isRequired) {
          shape[field.name] = z.coerce
            .number()
            .refine((val) => !isNaN(val), `${field.label || field.name} is required.`);
        } else {
          shape[field.name] = z.coerce.number().optional().nullable();
        }
      } else if (field.type === "boolean") {
        shape[field.name] = z.boolean().default(false);
      }
    });

    return z.object(shape);
  }, [schema]);

  const defaultValues = useMemo(() => {
    const defaults: Record<string, any> = {};
    schema.schema_definition.forEach((f) => {
      if (f.type === "boolean") defaults[f.name] = false;
      else defaults[f.name] = "";
    });
    return defaults;
  }, [schema]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(dynamicZodSchema),
    defaultValues,
  });

  if (!isOpen) return null;

  const onSubmit = async (formData: Record<string, any>) => {
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
    } else {
      reset();
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-plus text-brand-500"></i>
              Add Record: <span className="text-brand-500">{schema.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dynamic JSONB Document Entry
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
              <div key={field.name} className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {field.label || field.name}
                  {field.validation?.required && <span className="text-rose-500 ml-1">*</span>}
                  <span className="ml-2 text-[10px] font-normal text-slate-400">
                    ({field.type})
                  </span>
                </label>

                {field.type === "string" || field.type === "relation" ? (
                  <input
                    type="text"
                    {...register(field.name)}
                    placeholder={`Enter ${field.label || field.name}...`}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    step="any"
                    {...register(field.name)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : field.type === "boolean" ? (
                  <Controller
                    name={field.name}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <button
                        type="button"
                        onClick={() => onChange(!value)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
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
                        <span>{value ? "Active / True" : "Inactive / False"}</span>
                      </button>
                    )}
                  />
                ) : null}

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
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i> Saving Record...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i> Ingest Record
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
