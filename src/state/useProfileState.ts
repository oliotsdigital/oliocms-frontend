"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/models/profile.model";
import { UserSession } from "@/models/auth.model";
import { fetchProfileApi, updateProfileApi } from "@/api/profile.api";

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  role: "",
  avatar: "",
  apiKey: "",
};

export function useProfileState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onProfileUpdated?: () => void,
  session?: UserSession | null
) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);

  useEffect(() => {
    fetchProfileApi().then((data) => {
      setProfile({
        name: session?.name || data.name,
        email: session?.email || data.email,
        role: session?.role || data.role,
        avatar: session?.avatar || data.avatar,
        apiKey: session?.apiKey || data.apiKey,
      });
    });
  }, [session]);

  const updateProfileFields = (fields: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...fields }));
  };

  const saveProfile = async () => {
    const updated = await updateProfileApi(profile);
    setProfile(updated);
    if (onProfileUpdated) onProfileUpdated();
    if (showToast) showToast("Profile settings saved successfully!", "success");
  };

  const copyApiKey = () => {
    if (!profile.apiKey) {
      if (showToast) showToast("No API key available", "error");
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profile.apiKey);
    }
    if (showToast) showToast("API Key copied to clipboard!", "success");
  };

  return {
    profile,
    updateProfileFields,
    saveProfile,
    copyApiKey,
  };
}
