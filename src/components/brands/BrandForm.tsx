"use client";

import React from "react";
import { NewBrandForm } from "@/models/brand.model";

interface BrandFormProps {
  newBrand: NewBrandForm;
  onFormChange: (fields: Partial<NewBrandForm>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BrandForm: React.FC<BrandFormProps> = ({
  newBrand,
  onFormChange,
  onSubmit,
}) => {
  return (
    <div className="lg:col-span-5 glass-panel p-5 rounded-2xl h-fit space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Add New Brand</h3>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Brand Name</label>
          <input
            type="text"
            value={newBrand.name}
            onChange={(e) => onFormChange({ name: e.target.value })}
            required
            placeholder="e.g. Lumina Audio"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
          <input
            type="text"
            value={newBrand.slug}
            onChange={(e) => onFormChange({ slug: e.target.value })}
            placeholder="lumina-audio"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Parent Brand</label>
          <select
            value={newBrand.parent}
            onChange={(e) => onFormChange({ parent: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="None" className="bg-slate-900 text-white">None (Root Brand)</option>
            <option value="Apex Industries" className="bg-slate-900 text-white">Apex Industries</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
          <textarea
            value={newBrand.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            rows={2}
            placeholder="Brand narrative..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Thumbnail Image URL</label>
          <input
            type="text"
            value={newBrand.thumb}
            onChange={(e) => onFormChange({ thumb: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition"
        >
          Add Brand
        </button>
      </form>
    </div>
  );
};
