"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOlio } from "@/state/OlioProvider";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionsApi } from "@/api/collection.api";
import { CollectionsStudioView } from "@/components/collections/CollectionsStudioView";

export default function CollectionsPage() {
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
    <AppLayout pageTitle="Dynamic Collections">
      <CollectionsStudioView
        collections={collections}
        loading={loading}
        onRefresh={loadCollections}
        selectedProjectId={selectedProject?.id}
      />
    </AppLayout>
  );
}

