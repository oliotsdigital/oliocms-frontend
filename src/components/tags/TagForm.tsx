"use client";

import React from "react";
import { NewTagForm } from "@/models/tag.model";

interface TagFormProps {
  newTag: NewTagForm;
  onFormChange: (fields: Partial<NewTagForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TagForm: React.FC<TagFormProps> = ({
  newTag,
  onFormChange,
  onSubmit,
}) => {
  return (
    <div className="lg:col-span-5 glass-panel p-5 rounded-2xl h-fit space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Tag</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Tag Name</label>
          <input
            type="text"
            value={newTag.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            required
            placeholder="e.g. Eco-Friendly"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
          <input
            type="text"
            value={newTag.slug}
            onChange={(e) => onFormChange({ slug: e.target.value })}
            placeholder="eco-friendly"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            value={newTag.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={2}
            placeholder="Tag classification context..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Thumbnail Image URL</label>
          <input
            type="text"
            value={newTag.thumb}
            onChange={(e) => onFormChange({ thumb: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition"
        >
          Add Tag
        </button>
      </form>
    </div>
  );
};
