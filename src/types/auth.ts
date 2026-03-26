export type UserRole = "patient" | "doctor";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  profile?: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}
