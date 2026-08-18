"use client";

import { useState, useEffect } from "react";
import { Tag, NewTagForm } from "@/models/tag.model";
import { fetchTagsApi, createTagApi, deleteTagApi } from "@/api/tag.api";

export function useTagState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onTagCreated?: () => void
) {
  const [tagsList, setTagsList] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState<NewTagForm>({
    name: "",
    slug: "",
    description: "",
    thumb: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100",
  });

  useEffect(() => {
    fetchTagsApi().then((data) => setTagsList(data));
  }, []);

  const updateNewTagForm = (fields: Partial<NewTagForm>) => {
    setNewTag((prev) => ({ ...prev, ...fields }));
  };

  const saveTag = async () => {
    if (!newTag.name.trim()) {
      if (showToast) showToast("Tag name is required", "error");
      return;
    }

    const created = await createTagApi(newTag);
    setTagsList((prev) => [created, ...prev]);

    setNewTag({
      name: "",
      slug: "",
      description: "",
      thumb: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=100",
    });

    if (onTagCreated) onTagCreated();
    if (showToast) showToast("Tag added successfully", "success");
  };

  const deleteTag = async (id: number | string) => {
    await deleteTagApi(id);
    setTagsList((prev) => prev.filter((t) => t.id !== id));
    if (showToast) showToast("Tag removed", "info");
  };

  return {
    tagsList,
    newTag,
    updateNewTagForm,
    saveTag,
    deleteTag,
  };
}
