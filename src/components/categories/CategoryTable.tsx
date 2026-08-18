"use client";

import React from "react";
import { Category } from "@/models/category.model";

interface CategoryTableProps {
  categoriesList: Category[];
  onDeleteCategory: (id: number | string) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categoriesList,
  onDeleteCategory,
}) => {
  return (
    <div className="lg:col-span-7 glass-panel rounded-2xl overflow-hidden">
      <div className="p-3.5 border-b border-slate-200/40 dark:border-slate-800/40 font-semibold text-xs text-slate-900 dark:text-white flex items-center justify-between">
        <span>Created Categories ({categoriesList.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-200/30 dark:bg-slate-800/30 text-[11px] font-semibold text-slate-500 border-b border-slate-200/30 dark:border-slate-800/30">
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Slug</th>
              <th className="py-2.5 px-3">Parent</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-xs">
            {categoriesList.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 text-xs">
                  No categories created yet.
                </td>
              </tr>
            ) : (
              categoriesList.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition">
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cat.thumb}
                      alt={cat.name}
                      className="w-6 h-6 rounded-md object-cover bg-slate-200"
                    />
                    <span className="font-medium text-slate-900 dark:text-white">{cat.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{cat.slug}</td>
                  <td className="py-2.5 px-3 text-slate-500">{cat.parent}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="text-rose-500 hover:text-rose-600 p-1"
                      title="Delete Category"
                    >
                      <i className="fa-solid fa-trash text-[11px]"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
