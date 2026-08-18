"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CategoryManager } from "@/components/categories/CategoryManager";

export default function CategoriesPage() {
  return (
    <AppLayout pageTitle="Categories">
      <CategoryManager />
    </AppLayout>
  );
}
