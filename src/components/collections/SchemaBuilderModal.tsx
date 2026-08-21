import React, { useEffect, useState } from "react";
import { CollectionSchema, FieldDefinition } from "@/models/collection.model";
import { createCollectionSchemaApi, updateCollectionSchemaApi } from "@/api/collection.api";

interface SchemaBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CollectionSchema | null;
}

export const AVAILABLE_ICONS = [
  { class: "fa-cube", label: "Cube" },
  { class: "fa-box", label: "Product / Box" },
  { class: "fa-layer-group", label: "Layer Group" },
  { class: "fa-newspaper", label: "Articles / Blog" },
  { class: "fa-cart-shopping", label: "Ecommerce" },
  { class: "fa-users", label: "Users / Team" },
  { class: "fa-folder", label: "Folder" },
  { class: "fa-tag", label: "Tags" },
  { class: "fa-star", label: "Reviews" },
  { class: "fa-gear", label: "Settings" },
  { class: "fa-comment", label: "Comments" },
  { class: "fa-file-lines", label: "Documents" },
  { class: "fa-images", label: "Media" },
  { class: "fa-shield-halved", label: "Security" },
  { class: "fa-calendar-days", label: "Schedule" },
  { class: "fa-bullhorn", label: "Announcements" },
];

export const SchemaBuilderModal: React.FC<SchemaBuilderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [apiIdSingular, setApiIdSingular] = useState("");
  const [apiIdPlural, setApiIdPlural] = useState("");
  const [icon, setIcon] = useState("fa-cube");
  const [featuredImage, setFeaturedImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setApiIdSingular(initialData.api_id_singular || "");
      setApiIdPlural(initialData.api_id_plural || "");
      setIcon(initialData.icon || "fa-cube");
      setFeaturedImage(initialData.featured_image || "");
    } else {
      setName("");
      setSlug("");
      setApiIdSingular("");
      setApiIdPlural("");
      setIcon("fa-cube");
      setFeaturedImage("");
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    const cleaned = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-");
    setSlug(cleaned);

    const singular = cleaned.replace(/-+/g, "_");
    setApiIdSingular(singular);
    setApiIdPlural(singular ? (singular.endsWith("s") ? singular : `${singular}s`) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Collection Display Name is required.");
      return;
    }

    setLoading(true);
    let res;
    if (initialData) {
      res = await updateCollectionSchemaApi(initialData.id, {
        name: name.trim(),
        icon,
        featured_image: featuredImage.trim() || undefined,
        api_id_singular: apiIdSingular.trim() || undefined,
        api_id_plural: apiIdPlural.trim() || undefined,
      });
    } else {
      const defaultFields: FieldDefinition[] = [
        {
          name: "title",
          label: "Title",
          type: "string",
          validation: { required: true, unique: false },
        },
      ];
      res = await createCollectionSchemaApi({
        name: name.trim(),
        slug: slug.trim() || undefined,
        icon,
        featured_image: featuredImage.trim() || undefined,
        api_id_singular: apiIdSingular.trim() || undefined,
        api_id_plural: apiIdPlural.trim() || undefined,
        schema_definition: defaultFields,
      });
    }
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
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl border border-slate-200/50 dark:border-slate-800/50 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/40">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-brand-500"></i>
              {initialData ? "Edit Collection Settings" : "Create New Dynamic Collection"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define collection metadata, API UIDs, featured image, and sidebar icon
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
          {/* Display Name & URL Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Product, Article, Restaurant"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL Slug
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

          {/* API ID (Singular) & API ID (Plural) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                API ID (Singular)
              </label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5 leading-snug">
                The UID is used to generate the API routes and databases tables/collections
              </p>
              <input
                type="text"
                value={apiIdSingular}
                onChange={(e) => setApiIdSingular(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="e.g. product"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                API ID (Plural)
              </label>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1.5 leading-snug">
                Plural identifier for endpoints & collection arrays
              </p>
              <input
                type="text"
                value={apiIdPlural}
                onChange={(e) => setApiIdPlural(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="e.g. products"
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Featured Image Option (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Featured Image <span className="text-[10px] font-normal text-slate-400">(Optional)</span>
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  placeholder="Paste image URL (e.g. https://images.unsplash.com/...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <label className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5 shrink-0">
                  <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) {
                            setFeaturedImage(ev.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              {featuredImage && (
                <div className="relative w-full max-w-sm h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featuredImage}
                    alt="Featured Image Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setFeaturedImage("")}
                      className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition shadow-md flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-trash-can"></i> Remove Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collection Sidebar Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Collection Sidebar Icon
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVAILABLE_ICONS.map((ic) => (
                <button
                  key={ic.class}
                  type="button"
                  onClick={() => setIcon(ic.class)}
                  title={ic.label}
                  className={`p-2.5 rounded-xl border text-center transition flex items-center justify-center ${
                    icon === ic.class
                      ? "bg-brand-500/15 border-brand-500 text-brand-500 ring-2 ring-brand-500/30 font-bold"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <i className={`fa-solid ${ic.class} text-base`}></i>
                </button>
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
