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
      />

      <MediaGrid
        mediaList={media.filteredMedia}
        onDeleteMedia={media.deleteMedia}
      />

      <MediaUploadModal
        isOpen={media.showMediaModal}
        newMedia={media.newMedia}
        onFormChange={media.updateNewMediaForm}
        onUpload={media.uploadMedia}
        onClose={() => media.setShowMediaModal(false)}
      />
    </div>
  );
};
