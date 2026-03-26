export type UserRole = "patient" | "doctor";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
  profile?: any;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
  };
}

export * from "./auth";
export * from "./domain";
