"use client";

import React from "react";
import { NewProductForm } from "@/models/product.model";

interface ProductStage4MediaProps {
  newProduct: NewProductForm;
  onFormChange: (fields: Partial<NewProductForm>) => void;
}

export const ProductStage4Media: React.FC<ProductStage4MediaProps> = ({
  newProduct,
  onFormChange,
}) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stage 4: Product Image & Gallery</h3>
      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Main Cover Image URL
        </label>
        <input
          type="text"
          value={newProduct.image}
          onChange={(e) => onFormChange({ image: e.target.value })}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
          Product Gallery (Multiple Uploads Dropzone)
        </label>
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-brand-500 transition cursor-pointer">
          <i className="fa-solid fa-cloud-arrow-up text-2xl text-brand-500 mb-2"></i>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Drag and drop secondary gallery images here
          </p>
          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
        </div>
      </div>
    </div>
  );
};
