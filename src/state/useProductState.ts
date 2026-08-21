"use client";

import { useState, useEffect, useMemo } from "react";
import { Product, NewProductForm } from "@/models/product.model";
import { fetchProductsApi, createProductApi, updateProductApi, deleteProductApi } from "@/api/product.api";

export function useProductState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onProductCreated?: () => void,
  selectedProjectId?: string
) {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState<string>("");
  const [productTab, setProductTab] = useState<"all" | "add">("all");
  const [productStage, setProductStage] = useState<number>(1);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [newProduct, setNewProduct] = useState<NewProductForm>({
    name: "",
    shortDesc: "",
    description: "",
    category: "Electronics",
    type: "Simple",
    regularPrice: "",
    price: "",
    sku: "",
    stockStatus: "In Stock",
    length: "",
    width: "",
    height: "",
    weight: "",
    slug: "",
    visibility: "public",
    brand: "Lumina Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200",
  });

  useEffect(() => {
    fetchProductsApi(selectedProjectId).then((data) => setProductsList(data));
  }, [selectedProjectId]);

  const updateNewProductForm = (fields: Partial<NewProductForm>) => {
    setNewProduct((prev) => ({ ...prev, ...fields }));
  };

  const filteredProducts = useMemo(() => {
    return productsList.filter(
      (prod) =>
        prod.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        prod.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productsList, productSearch]);

  const saveProduct = async () => {
    if (!newProduct.name.trim()) {
      if (showToast) showToast("Please specify a product name", "error");
      return;
    }

    const created = await createProductApi(newProduct);
    setProductsList((prev) => [created, ...prev]);

    setNewProduct({
      name: "",
      shortDesc: "",
      description: "",
      category: "Electronics",
      type: "Simple",
      regularPrice: "",
      price: "",
      sku: "",
      stockStatus: "In Stock",
      length: "",
      width: "",
      height: "",
      weight: "",
      slug: "",
      visibility: "public",
      brand: "Lumina Audio",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200",
    });

    setProductTab("all");
    setProductStage(1);

    if (onProductCreated) onProductCreated();
    if (showToast) showToast("New product created & synchronized with GraphQL API", "success");
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const updated = await updateProductApi(updatedProduct);
    setProductsList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingProduct(null);
    if (showToast) showToast(`Product "${updated.name}" updated successfully`, "success");
  };

  const deleteProduct = async (id: number | string) => {
    await deleteProductApi(id);
    setProductsList((prev) => prev.filter((p) => p.id !== id));
    if (showToast) showToast("Product removed from store", "info");
  };

  return {
    productsList,
    filteredProducts,
    productSearch,
    setProductSearch,
    productTab,
    setProductTab,
    productStage,
    setProductStage,
    newProduct,
    editingProduct,
    setEditingProduct,
    updateNewProductForm,
    saveProduct,
    handleUpdateProduct,
    deleteProduct,
  };
}
