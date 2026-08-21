"use client";

import { useState } from "react";
import { ChecklistState } from "@/models/checklist.model";

export function useChecklistState() {
  const [checklist, setChecklist] = useState<ChecklistState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("oliocms_checklist");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return {
      profile: true,
      categories: true,
      brands: true,
      tags: false,
      firstProduct: false,
    };
  });

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("oliocms_checklist_dismissed") === "true";
    }
    return false;
  });

  const saveChecklist = (newVal: ChecklistState) => {
    setChecklist(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("oliocms_checklist", JSON.stringify(newVal));
    }
  };

  const handleSetDismissed = (val: boolean) => {
    setDismissed(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("oliocms_checklist_dismissed", String(val));
    }
  };

  const toggleChecklistItem = (key: keyof ChecklistState) => {
    saveChecklist({
      ...checklist,
      [key]: !checklist[key],
    });
  };

  const markCompleted = (key: keyof ChecklistState) => {
    saveChecklist({
      ...checklist,
      [key]: true,
    });
  };


  const completedChecklistCount = Object.values(checklist).filter(Boolean).length;
  const totalTasks = Object.keys(checklist).length;
  const checklistProgressPercent = Math.round((completedChecklistCount / totalTasks) * 100);

  return {
    checklist,
    dismissed,
    setDismissed: handleSetDismissed,
    toggleChecklistItem,
    markCompleted,
    completedChecklistCount,
    totalTasks,
    checklistProgressPercent,
  };
}

