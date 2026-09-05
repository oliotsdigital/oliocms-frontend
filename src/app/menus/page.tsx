"use client";

import React, { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MenusStudioView } from "@/components/menus/MenusStudioView";

function MenusContent() {
  return <MenusStudioView />;
}

export default function MenusPage() {
  return (
    <AppLayout pageTitle="Menus">
      <Suspense fallback={<div className="h-64 rounded-2xl glass-panel animate-pulse" />}>
        <MenusContent />
      </Suspense>
    </AppLayout>
  );
}
