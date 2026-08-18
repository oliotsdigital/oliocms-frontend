"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TagManager } from "@/components/tags/TagManager";

export default function TagsPage() {
  return (
    <AppLayout pageTitle="Tags">
      <TagManager />
    </AppLayout>
  );
}
