"use client";

import React from "react";
import { useOlio } from "@/state/OlioProvider";
import { WelcomeBanner } from "./WelcomeBanner";
import { SetupChecklist } from "./SetupChecklist";
import { QuickStatsGrid } from "./QuickStatsGrid";

export const DashboardContent: React.FC = () => {
  const { auth, checklist, products, categories, brands, media } = useOlio();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner userName={auth.user?.name || "Alex"} />

      <SetupChecklist
        checklist={checklist.checklist}
        completedCount={checklist.completedChecklistCount}
        progressPercent={checklist.checklistProgressPercent}
        dismissed={checklist.dismissed}
        onDismiss={() => checklist.setDismissed(true)}
        onToggleItem={checklist.toggleChecklistItem}
      />

      <QuickStatsGrid
        totalProducts={products.productsList.length}
        totalCategories={categories.categoriesList.length}
        totalBrands={brands.brandsList.length}
        totalMedia={media.mediaList.length}
      />
    </div>
  );
};
