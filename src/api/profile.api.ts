import { UserProfile } from "@/models/profile.model";

const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Morgan",
  email: "alex.morgan@oliocms.io",
  role: "Master CMS Administrator",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  apiKey: "olio_live_9921a881bc334ef",
};

export async function fetchProfileApi(): Promise<UserProfile> {
  await new Promise((res) => setTimeout(res, 200));
  return { ...DEFAULT_PROFILE };
}

export async function updateProfileApi(updated: Partial<UserProfile>): Promise<UserProfile> {
  await new Promise((res) => setTimeout(res, 300));
  return {
    ...DEFAULT_PROFILE,
    ...updated,
  };
}
