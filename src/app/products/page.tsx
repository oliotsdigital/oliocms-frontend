"use client";

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductManager } from "@/components/products/ProductManager";
import { useOlio } from "@/state/OlioProvider";

function ProductsContent() {
  const searchParams = useSearchParams();
  const { products } = useOlio();

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      products.setProductTab("add");
      products.setProductStage(1);
    }
  }, [searchParams, products]);

  return <ProductManager />;
}

export default function ProductsPage() {
  return (
    <AppLayout pageTitle="Products">
      <Suspense fallback={<div className="text-slate-400 text-xs p-4">Loading products...</div>}>
        <ProductsContent />
      </Suspense>
    </AppLayout>
  );
}
