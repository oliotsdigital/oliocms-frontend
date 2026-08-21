"use client";

import { useEffect, useState, useCallback } from "react";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionsApi } from "@/api/collection.api";

export function useCollectionState(selectedProjectId?: string) {
  const [collections, setCollections] = useState<CollectionSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCollections = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchCollectionsApi(selectedProjectId);
    setCollections(data);
    setIsLoading(false);
  }, [selectedProjectId]);

  useEffect(() => {
    refreshCollections();
  }, [refreshCollections]);

  return {
    collections,
    isLoading,
    refreshCollections,
  };
}
