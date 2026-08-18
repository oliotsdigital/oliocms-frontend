"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardContent } from "@/components/dashboard/DashboardContent";

export default function DashboardPage() {
  return (
    <AppLayout pageTitle="Dashboard">
      <DashboardContent />
    </AppLayout>
  );
}
