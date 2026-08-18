"use client";

import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProfileCard } from "@/components/profile/ProfileCard";

export default function ProfileSettingsPage() {
  return (
    <AppLayout pageTitle="Profile Settings">
      <ProfileCard />
    </AppLayout>
  );
}
