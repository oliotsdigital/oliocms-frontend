"use client";

import React, { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { CollectionsStudioView } from "@/components/collections/CollectionsStudioView";

function CollectionsContent() {
  return <CollectionsStudioView />;
}

export default function CollectionsPage() {
  return (
    <AppLayout pageTitle="Dynamic Collections">
      <Suspense fallback={<div className="h-64 rounded-2xl glass-panel animate-pulse" />}>
        <CollectionsContent />
      </Suspense>
    </AppLayout>
  );
}
