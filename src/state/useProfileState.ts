"use client";

import { useState, useEffect } from "react";
import { UserProfile } from "@/models/profile.model";
import { fetchProfileApi, updateProfileApi } from "@/api/profile.api";

export function useProfileState(
  showToast?: (msg: string, type?: "success" | "info" | "error") => void,
  onProfileUpdated?: () => void
) {
  const [profile, setProfile] = useState<UserProfile>({
    name: "Alex Morgan",
    email: "alex.morgan@oliocms.io",
    role: "Master CMS Administrator",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
    apiKey: "olio_live_9921a881bc334ef",
  });

  useEffect(() => {
    fetchProfileApi().then((data) => setProfile(data));
  }, []);

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
