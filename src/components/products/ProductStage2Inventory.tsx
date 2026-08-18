"use client";

import React from "react";
import { NewProductForm, StockStatus } from "@/models/product.model";

interface ProductStage2InventoryProps {
  newProduct: NewProductForm;
  onFormChange: (fields: Partial<NewProductForm>) => void;
}

export const ProductStage2Inventory: React.FC<ProductStage2InventoryProps> = ({
  newProduct,
  onFormChange,
}) => {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Stage 2: Pricing & Stock</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Regular Price ($)</label>
          <input
            type="number"
            value={newProduct.regularPrice}
            onChange={(e) => onFormChange({ regularPrice: e.target.value })}
            placeholder="199.00"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Selling Price ($)</label>
          <input
            type="number"
            value={newProduct.price}
            onChange={(e) => onFormChange({ price: e.target.value })}
            placeholder="149.00"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">SKU Code</label>
          <input
            type="text"
            value={newProduct.sku}
            onChange={(e) => onFormChange({ sku: e.target.value })}
            placeholder="OLIO-SKU-902"
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Status</label>
          <select
            value={newProduct.stockStatus}
            onChange={(e) => onFormChange({ stockStatus: e.target.value as StockStatus })}
            className="w-full px-3 py-2 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white"
          >
            <option value="In Stock" className="bg-slate-900 text-white">In Stock</option>
            <option value="Out of Stock" className="bg-slate-900 text-white">Out of Stock</option>
            <option value="Backorder" className="bg-slate-900 text-white">On Backorder</option>
          </select>
        </div>
      </div>
    </div>
  );
};
