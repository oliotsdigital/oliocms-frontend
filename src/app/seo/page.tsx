"use client";

import React, { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SeoStudioView } from "@/components/seo/SeoStudioView";

function SeoContent() {
  return <SeoStudioView />;
}

export default function SeoPage() {
  return (
    <AppLayout pageTitle="SEO Studio">
      <Suspense fallback={<div className="h-64 rounded-2xl glass-panel animate-pulse" />}>
        <SeoContent />
      </Suspense>
    </AppLayout>
  );
}
