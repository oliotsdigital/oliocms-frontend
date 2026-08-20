"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { ProjectManager } from "@/components/projects/ProjectManager";

export default function WebsitesPage() {
  return (
    <AppLayout pageTitle="Manage Websites">
      <ProjectManager />
    </AppLayout>
  );
}
