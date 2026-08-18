"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { TagForm } from "./TagForm";
import { TagTable } from "./TagTable";

export const TagManager: React.FC = () => {
  const { tags } = useOlio();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    tags.saveTag();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <TagForm
        newTag={tags.newTag}
        onFormChange={tags.updateNewTagForm}
        onSubmit={handleSubmit}
      />
      <TagTable
        tagsList={tags.tagsList}
        onDeleteTag={tags.deleteTag}
      />
    </div>
  );
};
