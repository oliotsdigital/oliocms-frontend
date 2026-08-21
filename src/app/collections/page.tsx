"use client";

import React, { useEffect, useState, Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOlio } from "@/state/OlioProvider";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionsApi } from "@/api/collection.api";
import { CollectionsStudioView } from "@/components/collections/CollectionsStudioView";

function CollectionsContent() {
  const { projectState } = useOlio();
  const selectedProject = projectState.selectedProject;
  const [collections, setCollections] = useState<CollectionSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCollections = async () => {
    setLoading(true);
    const data = await fetchCollectionsApi(selectedProject?.id);
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    loadCollections();
  }, [selectedProject?.id]);

  return (
    <CollectionsStudioView
      collections={collections}
      loading={loading}
      onRefresh={loadCollections}
      selectedProjectId={selectedProject?.id}
    />
  );
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

