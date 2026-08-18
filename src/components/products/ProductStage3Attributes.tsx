"use client";

import React from "react";
import { NewProductForm } from "@/models/product.model";
import { Brand } from "@/models/brand.model";

interface ProductStage3AttributesProps {
  newProduct: NewProductForm;
  brandsList: Brand[];
  onFormChange: (fields: Partial<NewProductForm>) => void;
}

export const ProductStage3Attributes: React.FC<ProductStage3AttributesProps> = ({
  newProduct,
  brandsList,
  onFormChange,
}) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stage 3: Dimensions, Tags & Brands</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Length (cm)</label>
          <input
            type="text"
            value={newProduct.length}
            onChange={(e) => onFormChange({ length: e.target.value })}
            placeholder="25"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Width (cm)</label>
          <input
            type="text"
            value={newProduct.width}
            onChange={(e) => onFormChange({ width: e.target.value })}
            placeholder="15"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">Height (cm)</label>
          <input
            type="text"
            value={newProduct.height}
            onChange={(e) => onFormChange({ height: e.target.value })}
            placeholder="10"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (KG)</label>
          <input
            type="text"
            value={newProduct.weight}
            onChange={(e) => onFormChange({ weight: e.target.value })}
            placeholder="0.85"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
          <input
            type="text"
            value={newProduct.slug}
            onChange={(e) => onFormChange({ slug: e.target.value })}
            placeholder="minimalist-studio-headphones"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
          <select
            value={newProduct.visibility}
            onChange={(e) => onFormChange({ visibility: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="public" className="bg-slate-900 text-white">Public</option>
            <option value="private" className="bg-slate-900 text-white">Private Draft</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Brand</label>
          <select
            value={newProduct.brand}
            onChange={(e) => onFormChange({ brand: e.target.value })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            {brandsList.map((b) => (
              <option key={b.id} value={b.name} className="bg-slate-900 text-white">
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
