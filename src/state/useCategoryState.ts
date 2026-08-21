"use client";

import { useState, useEffect } from "react";
import { Category, NewCategoryForm } from "@/models/category.model";
import { fetchCategoriesApi, createCategoryApi, deleteCategoryApi } from "@/api/category.api";

export function useCategoryState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onCategoryCreated?: () => void,
  selectedProjectId?: string
) {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    name: "",
    slug: "",
    parent: "None",
    description: "",
    thumb: "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=100",
  });

  useEffect(() => {
    fetchCategoriesApi(selectedProjectId).then((data) => setCategoriesList(data));
  }, [selectedProjectId]);

  const updateNewCategoryForm = (fields: Partial<NewCategoryForm>) => {
    setNewCategory((prev) => ({ ...prev, ...fields }));
  };

  const saveCategory = async () => {
    if (!newCategory.name.trim()) {
      if (showToast) showToast("Category name is required", "error");
      return;
    }

    const created = await createCategoryApi(newCategory);
    setCategoriesList((prev) => [created, ...prev]);

    setNewCategory({
      name: "",
      slug: "",
      parent: "None",
      description: "",
      thumb: "https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=100",
    });

    if (onCategoryCreated) onCategoryCreated();
    if (showToast) showToast("Category saved successfully", "success");
  };

  const deleteCategory = async (id: number | string) => {
    await deleteCategoryApi(id);
    setCategoriesList((prev) => prev.filter((c) => c.id !== id));
    if (showToast) showToast("Category removed", "info");
  };

  return {
    categoriesList,
    newCategory,
    updateNewCategoryForm,
    saveCategory,
    deleteCategory,
  };
}
