"use client";

import React, { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FormsStudioView } from "@/components/forms/FormsStudioView";

function FormsContent() {
  return <FormsStudioView />;
}

export default function FormsPage() {
  return (
    <AppLayout pageTitle="Forms">
      <Suspense fallback={<div className="h-64 rounded-2xl glass-panel animate-pulse" />}>
        <FormsContent />
      </Suspense>
    </AppLayout>
  );
}
