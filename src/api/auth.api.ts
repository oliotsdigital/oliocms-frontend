import { AuthForm, AuthResponse, UserSession } from "@/models/auth.model";

const DEFAULT_USER: UserSession = {
  id: "usr_101",
  name: "Alex Morgan",
  email: "admin@oliocms.io",
  role: "Admin Lead",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  apiKey: "olio_live_9921a881bc334ef",
};

export async function loginApi(form: AuthForm): Promise<AuthResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (!form.email || !form.password) {
    return { success: false, message: "Email and password are required" };
  }

  return {
    success: true,
    user: { ...DEFAULT_USER, email: form.email },
    message: "Signed in successfully!",
  };
}

export async function registerApi(form: AuthForm): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (form.password !== form.confirmPassword) {
    return { success: false, message: "Passwords do not match!" };
  }

  return {
    success: true,
    user: { ...DEFAULT_USER, email: form.email },
    message: "Welcome to OlioCMS! Account registered.",
  };
}

export async function logoutApi(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return { success: true };
}
