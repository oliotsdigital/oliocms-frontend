"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { CategoryForm } from "./CategoryForm";
import { CategoryTable } from "./CategoryTable";

export const CategoryManager: React.FC = () => {
  const { categories } = useOlio();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    categories.saveCategory();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <CategoryForm
        newCategory={categories.newCategory}
        onFormChange={categories.updateNewCategoryForm}
        onSubmit={handleSubmit}
      />
      <CategoryTable
        categoriesList={categories.categoriesList}
        onDeleteCategory={categories.deleteCategory}
      />
    </div>
  );
};
