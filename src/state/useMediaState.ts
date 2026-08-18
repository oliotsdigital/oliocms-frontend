"use client";

import { useState, useEffect, useMemo } from "react";
import { MediaItem, NewMediaForm } from "@/models/media.model";
import { fetchMediaApi, uploadMediaApi, deleteMediaApi } from "@/api/media.api";

export function useMediaState(showToast?: (msg: string, type?: "success" | "info" | "error") => void) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState<string>("");
  const [showMediaModal, setShowMediaModal] = useState<boolean>(false);
  const [newMedia, setNewMedia] = useState<NewMediaForm>({
    name: "",
    url: "",
  });

  useEffect(() => {
    fetchMediaApi().then((data) => setMediaList(data));
  }, []);

  const updateNewMediaForm = (fields: Partial<NewMediaForm>) => {
    setNewMedia((prev) => ({ ...prev, ...fields }));
  };

  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) =>
      item.name.toLowerCase().includes(mediaSearch.toLowerCase())
    );
  }, [mediaList, mediaSearch]);

  const uploadMedia = async () => {
    if (!newMedia.name.trim() || !newMedia.url.trim()) {
      if (showToast) showToast("Image name and URL are required", "error");
      return;
    }

    const uploaded = await uploadMediaApi(newMedia);
    setMediaList((prev) => [uploaded, ...prev]);

    setNewMedia({ name: "", url: "" });
    setShowMediaModal(false);

    if (showToast) showToast("Media asset uploaded!", "success");
  };

  const deleteMedia = async (id: number | string) => {
    await deleteMediaApi(id);
    setMediaList((prev) => prev.filter((m) => m.id !== id));
    if (showToast) showToast("Media asset removed", "info");
  };

  return {
    mediaList,
    filteredMedia,
    mediaSearch,
    setMediaSearch,
    showMediaModal,
    setShowMediaModal,
    newMedia,
    updateNewMediaForm,
    uploadMedia,
    deleteMedia,
  };
}
