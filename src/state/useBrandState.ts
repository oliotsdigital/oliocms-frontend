"use client";

import { useState, useEffect } from "react";
import { Brand, NewBrandForm } from "@/models/brand.model";
import { fetchBrandsApi, createBrandApi, deleteBrandApi } from "@/api/brand.api";

export function useBrandState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onBrandCreated?: () => void,
  selectedProjectId?: string
) {
  const [brandsList, setBrandsList] = useState<Brand[]>([]);
  const [newBrand, setNewBrand] = useState<NewBrandForm>({
    name: "",
    slug: "",
    parent: "None",
    description: "",
    thumb: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100",
  });

  useEffect(() => {
    fetchBrandsApi(selectedProjectId).then((data) => setBrandsList(data));
  }, [selectedProjectId]);

  const updateNewBrandForm = (fields: Partial<NewBrandForm>) => {
    setNewBrand((prev) => ({ ...prev, ...fields }));
  };

  const saveBrand = async () => {
    if (!newBrand.name.trim()) {
      if (showToast) showToast("Brand name is required", "error");
      return;
    }

    const created = await createBrandApi(newBrand);
    setBrandsList((prev) => [created, ...prev]);

    setNewBrand({
      name: "",
      slug: "",
      parent: "None",
      description: "",
      thumb: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=100",
    });

    if (onBrandCreated) onBrandCreated();
    if (showToast) showToast("Brand added successfully", "success");
  };

  const deleteBrand = async (id: number | string) => {
    await deleteBrandApi(id);
    setBrandsList((prev) => prev.filter((b) => b.id !== id));
    if (showToast) showToast("Brand deleted", "info");
  };

  return {
    brandsList,
    newBrand,
    updateNewBrandForm,
    saveBrand,
    deleteBrand,
  };
}
