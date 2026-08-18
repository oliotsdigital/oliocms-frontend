"use client";

import { useState } from "react";
import { ChecklistState } from "@/models/checklist.model";

export function useChecklistState() {
  const [checklist, setChecklist] = useState<ChecklistState>({
    profile: true,
    categories: true,
    brands: true,
    tags: false,
    firstProduct: false,
  });

  const [dismissed, setDismissed] = useState<boolean>(false);

  const toggleChecklistItem = (key: keyof ChecklistState) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const markCompleted = (key: keyof ChecklistState) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const totalTasks = Object.keys(checklist).length;
  const checklistProgressPercent = Math.round((completedChecklistCount / totalTasks) * 100);

  return {
    checklist,
    dismissed,
    setDismissed,
    toggleChecklistItem,
    markCompleted,
    completedChecklistCount,
    totalTasks,
    checklistProgressPercent,
  };
}
