"use client";

import React, { useState } from "react";
import { FieldDefinition, FieldType } from "@/models/collection.model";
import { createCollectionSchemaApi } from "@/api/collection.api";

interface SchemaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SchemaBuilderModal: React.FC<SchemaBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([
    {
      name: "title",
      label: "Title",
      type: "string",
      validation: { required: true, unique: false },
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setSlug(autoSlug);
  };

  const handleAddField = () => {
    const newFieldName = `field_${fields.length + 1}`;
    setFields([
      ...fields,
      {
        name: newFieldName,
        label: `Field ${fields.length + 1}`,
        type: "string",
        validation: { required: false, unique: false },
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) {
      setError("A collection schema must contain at least one field definition.");
      return;
    }
    setError(null);
    setFields(fields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (
    index: number,
    key: keyof FieldDefinition,
    value: any
  ) => {
    const updated = [...fields];
    if (key === "name") {
      updated[index].name = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    } else {
      (updated[index] as any)[key] = value;
    }
    setFields(updated);
  };

  const handleValidationToggle = (
    index: number,
    valKey: "required" | "unique"
  ) => {
    const updated = [...fields];
    const currentVal = updated[index].validation || {};
    updated[index].validation = {
      ...currentVal,
      [valKey]: !currentVal[valKey],
    };
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Collection name is required.");
      return;
    }

    // Validate duplicate field names
    const names = fields.map((f) => f.name.trim().toLowerCase());
    const hasDupes = names.some((n, idx) => names.indexOf(n) !== idx);
    if (hasDupes) {
      setError("Duplicate field keys detected in schema definition.");
      return;
    }

    setLoading(true);
    const res = await createCollectionSchemaApi({
      name: name.trim(),
      slug: slug.trim() || undefined,
      schema_definition: fields,
    });
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-brand-500"></i>
              Create New Dynamic Collection
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define metadata schema without dynamic SQL table creation (JSONB Document pattern)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-xl"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-5 flex-1 overflow-y-auto pr-1">
          {/* Collection Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Products, Articles, Invoices"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Collection Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated-slug"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Field Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Schema Field Definitions ({fields.length})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowJsonPreview(!showJsonPreview)}
                  className="text-[11px] text-slate-500 hover:text-brand-500 font-semibold underline"
                >
                  {showJsonPreview ? "Hide JSON Schema" : "View JSON Schema"}
                </button>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-2.5 py-1 rounded-lg bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i> Add Property
                </button>
              </div>
            </div>

            {showJsonPreview && (
              <div className="mb-4 p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-40 border border-slate-800">
                <pre>{JSON.stringify(fields, null, 2)}</pre>
              </div>
            )}

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center gap-3"
                >
                  {/* Field Name */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Key (snake_case)
                    </label>
                    <input
                      type="text"
                      required
                      value={field.name}
                      onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                      placeholder="field_name"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Field Label */}
                  <div className="flex-1">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Display Label
                    </label>
                    <input
                      type="text"
                      value={field.label || ""}
                      onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                      placeholder="Display Label"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Field Type */}
                  <div className="w-full md:w-36">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                      Property Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => handleFieldChange(idx, "type", e.target.value as FieldType)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="string">Text (String)</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean (Switch)</option>
                      <option value="relation">Relation ID</option>
                    </select>
                  </div>

                  {/* Validation Toggles */}
                  <div className="flex items-center gap-3 pt-2 md:pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!field.validation?.required}
                        onChange={() => handleValidationToggle(idx, "required")}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                      Required
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={!!field.validation?.unique}
                        onChange={() => handleValidationToggle(idx, "unique")}
                        className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                      />
                      Unique
                    </label>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-500/10 transition ml-auto md:ml-0"
                        title="Remove Field"
                      >
                        <i className="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Submit */}
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
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i> Create Collection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
