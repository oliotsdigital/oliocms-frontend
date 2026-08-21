"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CollectionSchema, FieldDefinition, FieldType } from "@/models/collection.model";
import { updateCollectionSchemaApi, deleteCollectionSchemaApi } from "@/api/collection.api";
import { useSearchParams } from "next/navigation";
import { SchemaBuilderModal, AVAILABLE_ICONS } from "./SchemaBuilderModal";
import { AddFieldModal } from "./AddFieldModal";
import { SelectIconModal } from "./SelectIconModal";
import { useOlio } from "@/state/OlioProvider";

interface CollectionItemCardProps {
  col: CollectionSchema;
  isSelected: boolean;
  onSelect: (col: CollectionSchema) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

const CollectionItemCard: React.FC<CollectionItemCardProps> = ({
  col,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const [imgError, setImgError] = useState(false);
  const hasFeaturedImage = !!col.featured_image && !imgError;

  return (
    <div
      onClick={() => onSelect(col)}
      className={`group cursor-pointer rounded-2xl p-3 transition-all duration-200 border flex items-center gap-3 ${
        isSelected
          ? "bg-brand-500/10 border-brand-500/50 shadow-lg shadow-brand-500/10 ring-1 ring-brand-500/30"
          : "glass-panel border-slate-200/50 dark:border-slate-800/50 hover:border-brand-500/30"
      }`}
    >
      {/* Featured Image to left side of collection name OR default icon if no image */}
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
        {hasFeaturedImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={col.featured_image}
            alt={col.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <i
            className={`fa-solid ${col.icon || "fa-cube"} text-base ${
              isSelected ? "text-brand-500" : "text-slate-500 dark:text-slate-400"
            }`}
          ></i>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4
            className={`text-xs font-bold truncate ${
              isSelected ? "text-brand-500" : "text-slate-900 dark:text-white"
            }`}
          >
            {col.name}
          </h4>
        </div>
        <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
          /{col.slug}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            {col.schema_definition?.length || 0} fields
          </span>
        </div>
      </div>

      <button
        onClick={(e) => onDelete(e, col.id, col.name)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100 shrink-0"
        title="Delete Collection"
      >
        <i className="fa-solid fa-trash-can text-xs"></i>
      </button>
    </div>
  );
};

export const CollectionsStudioView: React.FC = () => {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id");
  const { toast, collectionsState } = useOlio();
  const collections = collectionsState.collections;
  const loading = collectionsState.isLoading;
  const onRefresh = collectionsState.refreshCollections;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCollectionForModal, setEditingCollectionForModal] = useState<CollectionSchema | null>(null);
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  // Edit states for right-hand section
  const [editingName, setEditingName] = useState("");
  const [editingIcon, setEditingIcon] = useState("fa-cube");
  const [editingFeaturedImage, setEditingFeaturedImage] = useState("");
  const [editingFields, setEditingFields] = useState<FieldDefinition[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Automatically select target collection from URL or fallback to first collection
  useEffect(() => {
    if (collections.length > 0) {
      const targetCol = urlId ? collections.find((c) => c.id === urlId) : null;

      if (targetCol) {
        setSelectedId(targetCol.id);
        setEditingName(targetCol.name);
        setEditingIcon(targetCol.icon || "fa-cube");
        setEditingFeaturedImage(targetCol.featured_image || "");
        setEditingFields(JSON.parse(JSON.stringify(targetCol.schema_definition || [])));
      } else {
        const currentExists = collections.some((c) => c.id === selectedId);
        if (!selectedId || !currentExists) {
          const first = collections[0];
          setSelectedId(first.id);
          setEditingName(first.name);
          setEditingIcon(first.icon || "fa-cube");
          setEditingFeaturedImage(first.featured_image || "");
          setEditingFields(JSON.parse(JSON.stringify(first.schema_definition || [])));
        }
      }
    } else {
      setSelectedId(null);
      setEditingName("");
      setEditingIcon("fa-cube");
      setEditingFeaturedImage("");
      setEditingFields([]);
    }
  }, [collections, urlId]);

  // Sync edit state when user selects a collection from sidebar
  const handleSelectCollection = (col: CollectionSchema) => {
    setSelectedId(col.id);
    setEditingName(col.name);
    setEditingIcon(col.icon || "fa-cube");
    setEditingFeaturedImage(col.featured_image || "");
    setEditingFields(JSON.parse(JSON.stringify(col.schema_definition || [])));
  };

  const handleDeleteCollection = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete the collection schema "${name}"?`)) return;
    const res = await deleteCollectionSchemaApi(id);
    if (res.error) {
      if (toast) toast.showToast(res.error, "error");
    } else {
      if (toast) toast.showToast(`Collection "${name}" deleted successfully`, "success");
      onRefresh();
    }
  };

  const handleSaveSchema = async () => {
    if (!selectedId) return;
    if (!editingName.trim()) {
      if (toast) toast.showToast("Collection name is required", "error");
      return;
    }

    // Check duplicate keys
    const keys = editingFields.map((f) => f.name.trim().toLowerCase());
    const hasDuplicates = keys.some((k, idx) => keys.indexOf(k) !== idx);
    if (hasDuplicates) {
      if (toast) toast.showToast("Duplicate field keys detected in schema definition", "error");
      return;
    }

    setIsSaving(true);
    const res = await updateCollectionSchemaApi(selectedId, {
      name: editingName.trim(),
      icon: editingIcon,
      featured_image: editingFeaturedImage,
      schema_definition: editingFields,
    });
    setIsSaving(false);

    if (res.error) {
      if (toast) toast.showToast(res.error, "error");
    } else {
      if (toast) toast.showToast("Schema field definitions updated successfully!", "success");
      onRefresh();
    }
  };

  const selectedCollection = collections.find((c) => c.id === selectedId);
  const filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // Property Handlers for Schema Definition Editor
  const handleSelectFieldTypeFromModal = (type: FieldType, title: string) => {
    const nextNum = editingFields.length + 1;
    const cleanTypeKey = type.toLowerCase().replace(/[^a-z0-9]/g, "");
    const newField: FieldDefinition = {
      name: `${cleanTypeKey}_${nextNum}`,
      label: `${title} ${nextNum}`,
      type: type,
      validation: { required: false, unique: false },
    };
    setEditingFields([...editingFields, newField]);
  };

  const handleRemoveProperty = (index: number) => {
    if (editingFields.length <= 1) {
      if (toast) toast.showToast("A schema must contain at least one field definition", "error");
      return;
    }
    setEditingFields(editingFields.filter((_, idx) => idx !== index));
  };

  const handleFieldChange = (index: number, key: keyof FieldDefinition, value: any) => {
    const updated = [...editingFields];
    if (key === "name") {
      updated[index].name = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    } else {
      (updated[index] as any)[key] = value;
    }
    setEditingFields(updated);
  };

  const handleValidationToggle = (index: number, valKey: "required" | "unique") => {
    const updated = [...editingFields];
    const currentVal = updated[index].validation || {};
    updated[index].validation = {
      ...currentVal,
      [valKey]: !currentVal[valKey],
    };
    setEditingFields(updated);
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="glass-panel rounded-3xl p-4 sm:p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter collections by name or slug..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>Create New Dynamic Collection</span>
          </button>
        </div>
      </div>

      {/* Main Studio View: Sidebar + Schema Editor */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR: Available Collections */}
        <div className="w-full lg:w-80 shrink-0 glass-panel rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-brand-500"></i>
              Collections
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-bold text-xs">
              {collections.length}
            </span>
          </div>

          {/* Collections List */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredCollections.map((col) => (
                <CollectionItemCard
                  key={col.id}
                  col={col}
                  isSelected={col.id === selectedId}
                  onSelect={handleSelectCollection}
                  onDelete={handleDeleteCollection}
                />
              ))}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500">No collections found.</p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-brand-500 text-white font-bold text-xs transition hover:bg-brand-600"
              >
                + Create Collection
              </button>
            </div>
          )}
        </div>

        {/* RIGHT HAND SECTION: Schema Field Definitions & Live Editor */}
        <div className="flex-1 w-full glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
          {selectedCollection ? (
            <>
              {/* Header Bar of Selected Collection */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => setIsIconModalOpen(true)}
                      className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center cursor-pointer hover:bg-brand-500/20 transition group"
                      title="Click to select icon"
                    >
                      <i className={`fa-solid ${editingIcon} text-lg text-brand-500 group-hover:scale-110 transition-transform`}></i>
                    </div>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-brand-500 focus:outline-none transition px-1 py-0.5"
                    />
                  </div>
                </div>

                {/* Right Header CTAs */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCollectionForModal(selectedCollection);
                      setIsEditModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <i className="fa-solid fa-pen-to-square text-xs text-brand-500"></i>
                    <span>Edit Collection</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsIconModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <i className={`fa-solid ${editingIcon} text-brand-500 text-sm`}></i>
                    <span>Select Icon</span>
                  </button>

                  <Link
                    href={`/collections/${selectedCollection.id}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-2 shadow-sm"
                  >
                    <i className="fa-solid fa-table-cells text-xs"></i>
                    <span>View Records</span>
                  </Link>
                </div>
              </div>

              {/* Schema Field Definitions Editor Section */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <i className="fa-solid fa-sliders text-brand-500"></i>
                      Schema Field Definitions ({editingFields.length})
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure dynamic schema property keys, display labels, property types, and validation rules.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowJsonPreview(!showJsonPreview)}
                      className="text-xs font-semibold text-slate-500 hover:text-brand-500 transition underline"
                    >
                      {showJsonPreview ? "Hide JSON Schema" : "View JSON Schema"}
                    </button>

                    <button
                      onClick={() => setIsAddFieldModalOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 text-brand-500 hover:text-white font-bold text-xs transition flex items-center gap-2 shadow-sm"
                    >
                      <i className="fa-solid fa-plus text-xs"></i>
                      <span>Add Property</span>
                    </button>
                  </div>
                </div>

                {/* JSON Schema Live Preview */}
                {showJsonPreview && (
                  <div className="mb-4 p-4 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                    <pre>{JSON.stringify(editingFields, null, 2)}</pre>
                  </div>
                )}

                {/* Property Definition Cards List */}
                <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                  {editingFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40 transition-all flex flex-col md:flex-row md:items-center gap-4"
                    >
                      {/* Property Key */}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Key (snake_case)
                        </label>
                        <input
                          type="text"
                          required
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                          placeholder="property_key"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      {/* Display Label */}
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Display Label
                        </label>
                        <input
                          type="text"
                          value={field.label || ""}
                          onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                          placeholder="Display Label"
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>

                      {/* Property Type */}
                      <div className="w-full md:w-44">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Property Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(idx, "type", e.target.value as FieldType)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="string">Text (String)</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean (Switch)</option>
                          <option value="richtext">Rich text (Blocks)</option>
                          <option value="markdown">Rich text (Markdown)</option>
                          <option value="json">JSON</option>
                          <option value="email">Email</option>
                          <option value="date">Date</option>
                          <option value="password">Password</option>
                          <option value="media">Media</option>
                          <option value="enumeration">Enumeration</option>
                          <option value="relation">Relation ID</option>
                          <option value="uid">UID</option>
                          <option value="component">Component</option>
                          <option value="dynamiczone">Dynamic zone</option>
                        </select>
                      </div>

                      {/* Validation Toggles & Delete */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-2 md:pt-5 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={!!field.validation?.required}
                            onChange={() => handleValidationToggle(idx, "required")}
                            className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                          />
                          Required
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={!!field.validation?.unique}
                            onChange={() => handleValidationToggle(idx, "unique")}
                            className="rounded border-slate-300 text-brand-500 focus:ring-brand-500"
                          />
                          Unique
                        </label>

                        {editingFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProperty(idx)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                            title="Remove Property"
                          >
                            <i className="fa-solid fa-trash-can text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-end">
                <button
                  onClick={handleSaveSchema}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check text-xs"></i>
                      <span>Save Schema Changes</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="py-20 text-center glass-panel rounded-3xl border border-slate-200/50 dark:border-slate-800/50">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto text-2xl mb-4">
                <i className="fa-solid fa-database"></i>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                No Collection Selected
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Select a collection from the sidebar to inspect and edit its Schema Field Definitions, or create a new collection to get started.
              </p>
              <button
                onClick={() => setIsBuilderOpen(true)}
                className="mt-5 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition"
              >
                <i className="fa-solid fa-plus text-xs mr-1.5"></i> Create Collection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Schema Builder Modal (Create Mode) */}
      <SchemaBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={onRefresh}
      />

      {/* Schema Builder Modal (Edit Mode) */}
      <SchemaBuilderModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingCollectionForModal(null);
        }}
        onSuccess={onRefresh}
        initialData={editingCollectionForModal}
      />

      {/* Field Selection Popup Modal */}
      <AddFieldModal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        onSelectFieldType={handleSelectFieldTypeFromModal}
      />

      {/* Icon Picker Popup Modal */}
      <SelectIconModal
        isOpen={isIconModalOpen}
        currentIcon={editingIcon}
        onClose={() => setIsIconModalOpen(false)}
        onSelectIcon={(newIcon) => {
          setEditingIcon(newIcon);
          if (toast) toast.showToast("Collection icon updated! Click 'Save Schema Changes' to persist", "info");
        }}
      />
    </div>
  );
};
