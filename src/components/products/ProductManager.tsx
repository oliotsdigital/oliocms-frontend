"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { ProductListTable } from "./ProductListTable";
import { AddProductWizard } from "./AddProductWizard";
import { EditProductModal } from "./EditProductModal";

export const ProductManager: React.FC = () => {
  const { products, categories, brands } = useOlio();

  return (
    <div className="space-y-6">
      {/* Top Tab Bar: All Products / Add Product */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200/40 dark:border-slate-800/40">
        <button
          onClick={() => products.setProductTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            products.productTab === "all"
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <i className="fa-solid fa-list mr-2"></i> All Products
        </button>
        <button
          onClick={() => {
            products.setProductTab("add");
            products.setProductStage(1);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            products.productTab === "add"
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <i className="fa-solid fa-plus mr-2"></i> Add Product Form
        </button>
      </div>

      {products.productTab === "all" ? (
        <ProductListTable
          products={products.filteredProducts}
          searchQuery={products.productSearch}
          onSearchChange={products.setProductSearch}
          onEditProduct={(prod) => products.setEditingProduct(prod)}
          onDeleteProduct={products.deleteProduct}
          onSwitchToAdd={() => {
            products.setProductTab("add");
            products.setProductStage(1);
          }}
        />
      ) : (
        <AddProductWizard
          productStage={products.productStage}
          newProduct={products.newProduct}
          categoriesList={categories.categoriesList}
          brandsList={brands.brandsList}
          onStageChange={products.setProductStage}
          onFormChange={products.updateNewProductForm}
          onSaveProduct={products.saveProduct}
          onCancel={() => products.setProductTab("all")}
        />
      )}

      {/* Edit Product Popup Modal */}
      {products.editingProduct && (
        <EditProductModal
          product={products.editingProduct}
          categoriesList={categories.categoriesList}
          brandsList={brands.brandsList}
          onClose={() => products.setEditingProduct(null)}
          onSave={products.handleUpdateProduct}
        />
      )}
    </div>
  );
};
