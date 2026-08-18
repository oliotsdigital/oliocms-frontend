"use client";

import React from "react";
import { Product } from "@/models/product.model";

interface ProductListTableProps {
  products: Product[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: number | string) => void;
  onSwitchToAdd: () => void;
}

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  searchQuery,
  onSearchChange,
  onEditProduct,
  onDeleteProduct,
  onSwitchToAdd,
}) => {
  return (
    <div className="space-y-4">
      {/* Product List Controls Header */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products by title or SKU..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs glass-card border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <button
          onClick={onSwitchToAdd}
          className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Add New Product</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-200/30 dark:bg-slate-800/30 text-[11px] font-semibold text-slate-500 border-b border-slate-200/30 dark:border-slate-800/30">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-xs">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No products found matching &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : (
                products.map((prod) => (
                  <tr
                    key={prod.id}
                    onClick={() => onEditProduct(prod)}
                    className="hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition cursor-pointer group"
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-9 h-9 rounded-lg object-cover bg-slate-200 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-800"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-500 transition truncate max-w-[200px] block">
                          {prod.name}
                        </span>
                        <span className="text-[10px] text-slate-400">Click to edit details</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {prod.category}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {prod.sku}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      ${prod.price}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          prod.stockStatus === "In Stock"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {prod.stockStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{prod.type}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditProduct(prod)}
                          className="p-1.5 rounded-lg hover:bg-brand-500/10 text-brand-500 transition"
                          title="Edit Product"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button
                          onClick={() => onDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition"
                          title="Delete Product"
                        >
                          <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
