"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MediaManager } from "@/components/media/MediaManager";

export default function MediaPage() {
  return (
    <AppLayout pageTitle="Media">
      <MediaManager />
    </AppLayout>
  );
}
