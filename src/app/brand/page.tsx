"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { BrandManager } from "@/components/brands/BrandManager";

export default function BrandPage() {
  return (
    <AppLayout pageTitle="Brands">
      <BrandManager />
    </AppLayout>
  );
}
