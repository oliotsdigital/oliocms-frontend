"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MediaItem, NewMediaForm } from "@/models/media.model";
import { fetchMediaApi, uploadMediaApi, deleteMediaApi } from "@/api/media.api";

export function useMediaState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  selectedProjectId?: string
) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [mediaSearch, setMediaSearch] = useState<string>("");
  const [showMediaModal, setShowMediaModal] = useState<boolean>(false);
  const [newMedia, setNewMedia] = useState<NewMediaForm>({
    name: "",
    url: "",
    file: null,
  });

  const loadMedia = useCallback(async () => {
    if (!selectedProjectId) {
      setMediaList([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchMediaApi(selectedProjectId);
      setMediaList(data);
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Failed to load media files from Cloudflare R2", "error");
    } finally {
      setIsLoading(false);
    }
  }, [selectedProjectId, showToast]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const updateNewMediaForm = (fields: Partial<NewMediaForm>) => {
    setNewMedia((prev) => ({ ...prev, ...fields }));
  };

  const filteredMedia = useMemo(() => {
    if (!mediaSearch.trim()) return mediaList;
    const query = mediaSearch.toLowerCase().trim();
    return mediaList.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [mediaList, mediaSearch]);

  const uploadMedia = async () => {
    if (!newMedia.file && !newMedia.url?.trim()) {
      if (showToast) showToast("Please select a file or enter an image URL", "error");
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadMediaApi(newMedia.file || newMedia, selectedProjectId);
      if (uploaded) {
        setMediaList((prev) => [uploaded, ...prev]);
        setNewMedia({ name: "", url: "", file: null });
        setShowMediaModal(false);
        if (showToast) showToast("Media asset uploaded to Cloudflare R2!", "success");
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Failed to upload media asset", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDirectFile = async (file: File) => {
    setIsUploading(true);
    try {
      const uploaded = await uploadMediaApi(file, selectedProjectId);
      if (uploaded) {
        setMediaList((prev) => [uploaded, ...prev]);
        if (showToast) showToast(`Uploaded "${file.name}" to Cloudflare R2`, "success");
        return uploaded;
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Failed to upload file to Cloudflare R2", "error");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMedia = async (target: MediaItem | number | string) => {
    let keyOrPath = "";
    if (typeof target === "object" && target !== null) {
      keyOrPath = target.key || target.path || String(target.id);
    } else {
      const found = mediaList.find((m) => m.id === target);
      keyOrPath = found?.key || found?.path || String(target);
    }

    try {
      const success = await deleteMediaApi(keyOrPath, selectedProjectId);
      if (success) {
        setMediaList((prev) => prev.filter((m) => {
          if (typeof target === "object") return m.id !== target.id;
          return m.id !== target && m.key !== keyOrPath && m.path !== keyOrPath;
        }));
        if (showToast) showToast("Media asset deleted from Cloudflare R2", "info");
      } else {
        if (showToast) showToast("Could not delete media asset", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Error deleting media asset", "error");
    }
  };

  return {
    mediaList,
    filteredMedia,
    isLoading,
    isUploading,
    mediaSearch,
    setMediaSearch,
    showMediaModal,
    setShowMediaModal,
    newMedia,
    updateNewMediaForm,
    uploadMedia,
    uploadDirectFile,
    deleteMedia,
    refreshMedia: loadMedia,
    selectedProjectId,
  };
}
