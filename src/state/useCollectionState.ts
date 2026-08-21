"use client";

import { useEffect, useState, useCallback } from "react";
import { CollectionSchema } from "@/models/collection.model";
import { fetchCollectionsApi } from "@/api/collection.api";

export function useCollectionState(selectedProjectId?: string) {
  const [collections, setCollections] = useState<CollectionSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshCollections = useCallback(async () => {
    if (!selectedProjectId) {
      setCollections([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const data = await fetchCollectionsApi(selectedProjectId);
    setCollections(data);
    setIsLoading(false);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setCollections([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      const data = await fetchCollectionsApi(selectedProjectId);
      if (cancelled) return;
      setCollections(data);
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  return {
    collections,
    isLoading,
    refreshCollections,
  };
}
