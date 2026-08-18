"use client";

import React from "react";
import { NewCategoryForm } from "@/models/category.model";

interface CategoryFormProps {
  newCategory: NewCategoryForm;
  onFormChange: (fields: Partial<NewCategoryForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  newCategory,
  onFormChange,
  onSubmit,
}) => {
  return (
    <div className="lg:col-span-5 glass-panel p-5 rounded-2xl h-fit space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Category</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
          <input
            type="text"
            value={newCategory.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            required
            placeholder="e.g. Wearable Tech"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
          <input
            type="text"
            value={newCategory.slug}
            onChange={(e) => onFormChange({ slug: e.target.value })}
            placeholder="wearable-tech"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Category</label>
          <select
            value={newCategory.parent}
            onChange={(e) => onFormChange({ parent: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="None" className="bg-slate-900 text-white">None (Root Level)</option>
            <option value="Electronics" className="bg-slate-900 text-white">Electronics</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            value={newCategory.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={2}
            placeholder="Category summary..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Thumbnail Image URL</label>
          <input
            type="text"
            value={newCategory.thumb}
            onChange={(e) => onFormChange({ thumb: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition"
        >
          Add Category
        </button>
      </form>
    </div>
  );
};
