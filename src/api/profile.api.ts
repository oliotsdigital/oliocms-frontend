import { UserProfile } from "@/models/profile.model";

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  role: "",
  avatar: "",
  apiKey: "",
};

export async function fetchProfileApi(): Promise<UserProfile> {
  return { ...EMPTY_PROFILE };
}

export async function updateProfileApi(updated: Partial<UserProfile>): Promise<UserProfile> {
  return {
    ...EMPTY_PROFILE,
    ...updated,
  };
}
