"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useOlio } from "@/state/OlioProvider";
import { MediaToolbar } from "./MediaToolbar";
import { MediaGrid } from "./MediaGrid";
import { MediaUploadModal } from "./MediaUploadModal";
import { Pagination } from "@/components/collections/Pagination";

const MEDIA_PAGE_SIZE_OPTIONS = [12, 24, 48, 96];

export const MediaManager: React.FC = () => {
  const { media } = useOlio();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Reset to first page when search query or selected project changes
  useEffect(() => {
    setCurrentPage(1);
  }, [media.mediaSearch, media.selectedProjectId]);

  const totalItems = media.filteredMedia.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Auto-clamp page if it becomes out of range (e.g. after deletion or search)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated slice of filtered media
  const paginatedMedia = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return media.filteredMedia.slice(startIndex, startIndex + pageSize);
  }, [media.filteredMedia, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const isFiltered = Boolean(media.mediaSearch.trim());

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
        mediaList={paginatedMedia}
        isLoading={media.isLoading}
        onDeleteMedia={media.deleteMedia}
        selectedProjectId={media.selectedProjectId}
        isFiltered={isFiltered}
      />

      {Boolean(media.selectedProjectId) && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={MEDIA_PAGE_SIZE_OPTIONS}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={media.isLoading}
          pageSizeLabel="Items per page:"
          itemLabel="media files"
        />
      )}

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
