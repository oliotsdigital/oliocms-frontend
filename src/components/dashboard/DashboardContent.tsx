"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useOlio } from "@/state/OlioProvider";
import { WelcomeBanner } from "./WelcomeBanner";
import { SetupChecklist } from "./SetupChecklist";
import { QuickStatsGrid } from "./QuickStatsGrid";
import { DashboardWidget, WidgetWidth } from "@/models/widget.model";
import { AddWidgetModal } from "./AddWidgetModal";
import { CollectionWidgetCard } from "./CollectionWidgetCard";

export const DashboardContent: React.FC = () => {
  const { auth, checklist, media, collectionsState, projectState } = useOlio();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const activeProjectId = projectState.selectedProject?.id || "default";
  const storageKey = `oliocms_dashboard_widgets_${activeProjectId}`;

  // Load widgets from localStorage on project change / mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setWidgets(JSON.parse(saved));
      } else {
        setWidgets([]);
      }
    } catch {
      setWidgets([]);
    }
    setIsLoaded(true);
  }, [storageKey]);

  // Persist widgets to localStorage whenever updated
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch {
      // ignore storage errors
    }
  }, [widgets, storageKey, isLoaded]);

  const handleAddWidget = useCallback((data: { collectionId: string; width: WidgetWidth; limit: number }) => {
    const newWidget: DashboardWidget = {
      id: `widget_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      collectionId: data.collectionId,
      width: data.width,
      limit: data.limit,
      createdAt: Date.now(),
    };
    setWidgets((prev) => [...prev, newWidget]);
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }, []);

  const handleOpenAddModal = useCallback(() => setIsAddModalOpen(true), []);
  const handleCloseAddModal = useCallback(() => setIsAddModalOpen(false), []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner userName={auth.user?.name} />

      <SetupChecklist
        checklist={checklist.checklist}
        completedCount={checklist.completedChecklistCount}
        progressPercent={checklist.checklistProgressPercent}
        dismissed={checklist.dismissed}
        onDismiss={() => checklist.setDismissed(true)}
        onToggleItem={checklist.toggleChecklistItem}
      />

      {/* Quick Stats Grid */}
      <QuickStatsGrid
        totalCollections={collectionsState.collections.length}
        totalMedia={media.mediaList.length}
      />

      {/* Dashboard Collection Widgets */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-12 gap-5 pt-1">
          {widgets.map((widget) => {
            const col = collectionsState.collections.find((c) => c.id === widget.collectionId);
            if (!col) return null;
            return (
              <CollectionWidgetCard
                key={widget.id}
                widget={widget}
                collection={col}
                onRemove={handleRemoveWidget}
              />
            );
          })}
        </div>
      )}

      {/* Dashed line rectangle with Add Widget button in between */}
      <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700/80 hover:border-brand-500/60 dark:hover:border-brand-500/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition group bg-slate-50/40 dark:bg-slate-900/30">
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/25 transition transform active:scale-95 flex items-center gap-2 group-hover:shadow-brand-500/40 cursor-pointer"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Add Widget</span>
        </button>
        <p className="mt-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
          Add custom collection records table with 1/3, 2/3, or full width layout
        </p>
      </div>

      {/* Add Widget Popup Modal */}
      {isAddModalOpen && (
        <AddWidgetModal
          isOpen
          onClose={handleCloseAddModal}
          onAddWidget={handleAddWidget}
          collections={collectionsState.collections}
        />
      )}
    </div>
  );
};

