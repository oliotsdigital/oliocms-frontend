"use client";

import React from "react";
import { NewProductForm, ProductType } from "@/models/product.model";
import { Category } from "@/models/category.model";

interface ProductStage1GeneralProps {
  newProduct: NewProductForm;
  categoriesList: Category[];
  onFormChange: (fields: Partial<NewProductForm>) => void;
}

export const ProductStage1General: React.FC<ProductStage1GeneralProps> = ({
  newProduct,
  categoriesList,
  onFormChange,
}) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stage 1: General Information</h3>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
        <input
          type="text"
          value={newProduct.name}
          onChange={(e) => onFormChange({ name: e.target.value })}
          placeholder="e.g. Minimalist Studio Headphones"
          className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Short Description</label>
        <input
          type="text"
          value={newProduct.shortDesc}
          onChange={(e) => onFormChange({ shortDesc: e.target.value })}
          placeholder="Brief tagline overview..."
          className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full Description</label>
        <textarea
          value={newProduct.description}
          onChange={(e) => onFormChange({ description: e.target.value })}
          rows={3}
          placeholder="Detailed product spec & copy..."
          className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
        ></textarea>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
          <select
            value={newProduct.category}
            onChange={(e) => onFormChange({ category: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            {categoriesList.map((cat) => (
              <option key={cat.id} value={cat.name} className="bg-slate-900 text-white">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Product Type</label>
          <select
            value={newProduct.type}
            onChange={(e) => onFormChange({ type: e.target.value as ProductType })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="Simple" className="bg-slate-900 text-white">Simple Product</option>
            <option value="Variable" className="bg-slate-900 text-white">Variable Product</option>
            <option value="Digital" className="bg-slate-900 text-white">Digital Download</option>
          </select>
        </div>
      </div>
    </div>
  );
};
