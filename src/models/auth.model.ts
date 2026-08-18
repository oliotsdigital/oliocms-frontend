export interface AuthForm {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  apiKey: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserSession;
  message?: string;
}
