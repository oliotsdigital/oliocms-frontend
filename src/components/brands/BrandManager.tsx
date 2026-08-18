"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { BrandForm } from "./BrandForm";
import { BrandTable } from "./BrandTable";

export const BrandManager: React.FC = () => {
  const { brands } = useOlio();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    brands.saveBrand();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <BrandForm
        newBrand={brands.newBrand}
        onFormChange={brands.updateNewBrandForm}
        onSubmit={handleSubmit}
      />
      <BrandTable
        brandsList={brands.brandsList}
        onDeleteBrand={brands.deleteBrand}
      />
    </div>
  );
};
