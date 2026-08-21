"use client";

import React, { createContext, useContext } from "react";
import { useToastState } from "./useToastState";
import { useThemeState } from "./useThemeState";
import { useChecklistState } from "./useChecklistState";
import { useAuthStore } from "./useAuthStore";
import { useProductState } from "./useProductState";
import { useCategoryState } from "./useCategoryState";
import { useBrandState } from "./useBrandState";
import { useTagState } from "./useTagState";
import { useMediaState } from "./useMediaState";
import { useProfileState } from "./useProfileState";
import { useProjectState } from "./useProjectState";
import { useCollectionState } from "./useCollectionState";

type OlioContextType = {
  toast: ReturnType<typeof useToastState>;
  theme: ReturnType<typeof useThemeState>;
  checklist: ReturnType<typeof useChecklistState>;
  auth: ReturnType<typeof useAuthStore>;
  products: ReturnType<typeof useProductState>;
  categories: ReturnType<typeof useCategoryState>;
  brands: ReturnType<typeof useBrandState>;
  tags: ReturnType<typeof useTagState>;
  media: ReturnType<typeof useMediaState>;
  profile: ReturnType<typeof useProfileState>;
  projectState: ReturnType<typeof useProjectState>;
  collectionsState: ReturnType<typeof useCollectionState>;
};

const OlioContext = createContext<OlioContextType | null>(null);

export function OlioProvider({ children }: { children: React.ReactNode }) {
  const toast = useToastState();
  const theme = useThemeState();
  const checklist = useChecklistState();

  const auth = useAuthStore(toast.showToast);
  const projectState = useProjectState(toast.showToast, auth.isLoggedIn, auth.isInitializing);
  const activeProjectId = projectState.selectedProject?.id;

  const collectionsState = useCollectionState(activeProjectId);

  const profile = useProfileState(toast.showToast, () => {
    checklist.markCompleted("profile");
  });

  const categories = useCategoryState(
    toast.showToast,
    () => {
      checklist.markCompleted("categories");
    },
    activeProjectId
  );

  const brands = useBrandState(
    toast.showToast,
    () => {
      checklist.markCompleted("brands");
    },
    activeProjectId
  );

  const tags = useTagState(
    toast.showToast,
    () => {
      checklist.markCompleted("tags");
    },
    activeProjectId
  );

  const products = useProductState(
    toast.showToast,
    () => {
      checklist.markCompleted("firstProduct");
    },
    activeProjectId
  );

  const media = useMediaState(toast.showToast, activeProjectId);

  return (
    <OlioContext.Provider
      value={{
        toast,
        theme,
        checklist,
        auth,
        products,
        categories,
        brands,
        tags,
        media,
        profile,
        projectState,
        collectionsState,
      }}
    >
      {children}
    </OlioContext.Provider>
  );
}

export function useOlio() {
  const context = useContext(OlioContext);
  if (!context) {
    throw new Error("useOlio must be used within an OlioProvider");
  }
  return context;
}
