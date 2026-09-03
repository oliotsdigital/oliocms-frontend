"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { MediaToolbar } from "./MediaToolbar";
import { MediaGrid } from "./MediaGrid";
import { MediaUploadModal } from "./MediaUploadModal";

export const MediaManager: React.FC = () => {
  const { media } = useOlio();

  return (
    <div className="space-y-5">
      <MediaToolbar
        mediaSearch={media.mediaSearch}
        onSearchChange={media.setMediaSearch}
        onOpenUploadModal={() => media.setShowMediaModal(true)}
        onRefresh={media.refreshMedia}
        isLoading={media.isLoading}
        totalCount={media.mediaList.length}
      />

      <MediaGrid
        mediaList={media.filteredMedia}
        isLoading={media.isLoading}
        onDeleteMedia={media.deleteMedia}
        selectedProjectId={media.selectedProjectId}
      />

      <MediaUploadModal
        isOpen={media.showMediaModal}
        newMedia={media.newMedia}
        isUploading={media.isUploading}
        onFormChange={media.updateNewMediaForm}
        onUpload={media.uploadMedia}
        onClose={() => media.setShowMediaModal(false)}
      />
    </div>
  );
};
