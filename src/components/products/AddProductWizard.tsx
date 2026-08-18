"use client";

import React from "react";
import { NewProductForm } from "@/models/product.model";
import { Category } from "@/models/category.model";
import { Brand } from "@/models/brand.model";
import { ProductStage1General } from "./ProductStage1General";
import { ProductStage2Inventory } from "./ProductStage2Inventory";
import { ProductStage3Attributes } from "./ProductStage3Attributes";
import { ProductStage4Media } from "./ProductStage4Media";

interface AddProductWizardProps {
  productStage: number;
  newProduct: NewProductForm;
  categoriesList: Category[];
  brandsList: Brand[];
  onStageChange: (stage: number) => void;
  onFormChange: (fields: Partial<NewProductForm>) => void;
  onSaveProduct: () => void;
  onCancel: () => void;
}

export const AddProductWizard: React.FC<AddProductWizardProps> = ({
  productStage,
  newProduct,
  categoriesList,
  brandsList,
  onStageChange,
  onFormChange,
  onSaveProduct,
  onCancel,
}) => {
  return (
    <div className="glass-panel p-6 rounded-2xl space-y-6">
      {/* Wizard Header & Stepper */}
      <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Create New Store Item</h2>
          <p className="text-xs text-slate-500">Multi-stage product metadata & asset definition</p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-xl glass-card text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </button>
      </div>

      {/* Stage Stepper Navigation Pills */}
      <div className="flex items-center justify-center gap-4 md:gap-8 max-w-xl mx-auto py-2">
        <div
          className="flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => onStageChange(1)}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              productStage === 1
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            1
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              productStage === 1 ? "text-brand-500" : "text-slate-400"
            }`}
          >
            General
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => onStageChange(2)}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              productStage === 2
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            2
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              productStage === 2 ? "text-brand-500" : "text-slate-400"
            }`}
          >
            Inventory
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => onStageChange(3)}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              productStage === 3
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            3
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              productStage === 3 ? "text-brand-500" : "text-slate-400"
            }`}
          >
            Attributes
          </span>
        </div>

        <div
          className="flex flex-col items-center gap-1 cursor-pointer"
          onClick={() => onStageChange(4)}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              productStage === 4
                ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500"
            }`}
          >
            4
          </div>
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              productStage === 4 ? "text-brand-500" : "text-slate-400"
            }`}
          >
            Media
          </span>
        </div>
      </div>

      {/* Dynamic Stage Rendering */}
      {productStage === 1 && (
        <ProductStage1General
          newProduct={newProduct}
          categoriesList={categoriesList}
          onFormChange={onFormChange}
        />
      )}

      {productStage === 2 && (
        <ProductStage2Inventory
          newProduct={newProduct}
          onFormChange={onFormChange}
        />
      )}

      {productStage === 3 && (
        <ProductStage3Attributes
          newProduct={newProduct}
          brandsList={brandsList}
          onFormChange={onFormChange}
        />
      )}

      {productStage === 4 && (
        <ProductStage4Media
          newProduct={newProduct}
          onFormChange={onFormChange}
        />
      )}

      {/* Multi-step Form Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/40 dark:border-slate-800/40 max-w-2xl mx-auto">
        {productStage > 1 ? (
          <button
            onClick={() => onStageChange(productStage - 1)}
            className="px-4 py-2 rounded-xl glass-card text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <i className="fa-solid fa-arrow-left mr-1"></i> Previous
          </button>
        ) : (
          <div></div>
        )}

        {productStage < 4 ? (
          <button
            onClick={() => onStageChange(productStage + 1)}
            className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium shadow-md shadow-brand-500/20 transition"
          >
            Next Stage <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        ) : (
          <button
            onClick={onSaveProduct}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium shadow-md shadow-emerald-500/20 transition"
          >
            <i className="fa-solid fa-check mr-1"></i> Publish Product
          </button>
        )}
      </div>
    </div>
  );
};
