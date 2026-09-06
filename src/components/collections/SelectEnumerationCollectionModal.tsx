"use client";

import React, { useState, useEffect } from "react";
import { CollectionSchema } from "@/models/collection.model";
import { resolveMediaUrl } from "@/utils/media";

export interface EnumerationConfirmData {
  collection: CollectionSchema;
  key: string;
  label: string;
  required: boolean;
}

interface SelectEnumerationCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: CollectionSchema[];
  onConfirm: (data: EnumerationConfirmData) => void;
  initialSelectedCollectionId?: string;
  initialKey?: string;
  initialLabel?: string;
  initialRequired?: boolean;
  isEditingExisting?: boolean;
  existingKeys?: string[];
}

export const SelectEnumerationCollectionModal: React.FC<
  SelectEnumerationCollectionModalProps
> = ({
  isOpen,
  onClose,
  collections,
  onConfirm,
  initialSelectedCollectionId = "",
  initialKey = "",
  initialLabel = "",
  initialRequired = false,
  isEditingExisting = false,
  existingKeys = [],
}) => {
  const [selectedId, setSelectedId] = useState(initialSelectedCollectionId);
  const [fieldKey, setFieldKey] = useState(initialKey);
  const [fieldLabel, setFieldLabel] = useState(initialLabel);
  const [isRequired, setIsRequired] = useState(initialRequired);
  const [error, setError] = useState<string | null>(null);

  // Sync state when modal opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setSelectedId(initialSelectedCollectionId);
      setFieldKey(initialKey);
      setFieldLabel(initialLabel);
      setIsRequired(initialRequired);
      setError(null);
    }
  }, [isOpen, initialSelectedCollectionId, initialKey, initialLabel, initialRequired]);

  if (!isOpen) return null;

  const validCollections = collections.filter((c) => !c.is_deleted);
  const selectedCollection = validCollections.find((c) => c.id === selectedId);

  const handleCollectionChange = (newId: string) => {
    setSelectedId(newId);
    setError(null);

    const target = validCollections.find((c) => c.id === newId);
    if (target) {
      // Auto-suggest key and label if creating a new property or if current values are empty
      if (!isEditingExisting || !fieldKey) {
        const cleanSlug = target.slug
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "_")
          .replace(/_+/g, "_")
          .replace(/^_|_$/g, "");

        let suggestedKey = `${cleanSlug}_id`;
        let counter = 1;
        while (existingKeys.includes(suggestedKey.toLowerCase())) {
          suggestedKey = `${cleanSlug}_id_${counter}`;
          counter++;
        }
        setFieldKey(suggestedKey);
      }

      if (!isEditingExisting || !fieldLabel) {
        setFieldLabel(target.name);
      }
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCollection) {
      setError("Please select an available collection from the dropdown.");
      return;
    }

    const cleanKey = fieldKey
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");

    if (!cleanKey) {
      setError("Property key is required and must contain alphanumeric characters or underscores.");
      return;
    }

    // Check duplicate key if key changed or adding new
    if (
      (!isEditingExisting || cleanKey !== initialKey.toLowerCase()) &&
      existingKeys.map((k) => k.toLowerCase()).includes(cleanKey)
    ) {
      setError(`Property key "${cleanKey}" already exists in this schema.`);
      return;
    }

    const finalLabel = fieldLabel.trim() || selectedCollection.name;

    onConfirm({
      collection: selectedCollection,
      key: cleanKey,
      label: finalLabel,
      required: isRequired,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div
        className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200/40 dark:border-slate-800/40">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold text-base shrink-0 shadow-sm">
              <i className="fa-solid fa-list-ul"></i>
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                {isEditingExisting ? "Configure Enumeration Property" : "Select Collection for Enumeration"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose a collection to provide available option items for this field
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-white transition flex items-center justify-center shrink-0"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-sm"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="py-5 space-y-4 flex-1 overflow-y-auto pr-1">
          {validCollections.length === 0 ? (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl mb-3">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                No Collections Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                There are no other collections in this project yet. Please create another collection first before setting up an Enumeration field.
              </p>
            </div>
          ) : (
            <>
              {/* Collection Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <i className="fa-solid fa-layer-group text-purple-500"></i>
                    Target Collection Dropdown
                    <span className="text-rose-500 ml-0.5">*</span>
                  </span>
                  <span className="text-[10px] font-normal text-slate-400">
                    {validCollections.length} collections available
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={(e) => handleCollectionChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition appearance-none cursor-pointer pr-10 shadow-sm"
                  >
                    <option value="" disabled>
                      -- Select an available collection --
                    </option>
                    {validCollections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name} (/{col.slug})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>

              {/* Selected Collection Card Preview */}
              {selectedCollection && (
                <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-purple-500/20 bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-base shadow-sm">
                    {selectedCollection.featured_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={resolveMediaUrl(selectedCollection.featured_image)}
                        alt={selectedCollection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <i className={`fa-solid ${selectedCollection.icon || "fa-cube"}`}></i>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {selectedCollection.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[10px] font-mono font-bold">
                        /{selectedCollection.slug}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {selectedCollection.schema_definition?.length || 0} fields in schema definition
                    </p>
                  </div>
                </div>
              )}

              {/* Property Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Property Key (snake_case)
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldKey}
                    onChange={(e) =>
                      setFieldKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    placeholder="e.g. category_id"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Display Label
                  </label>
                  <input
                    type="text"
                    required
                    value={fieldLabel}
                    onChange={(e) => setFieldLabel(e.target.value)}
                    placeholder="e.g. Category"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>
              </div>

              {/* Validation Checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span>Mark as Required Field</span>
                </label>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedId || validCollections.length === 0}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check text-xs"></i>
              <span>{isEditingExisting ? "Save Property" : "Add Property"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
