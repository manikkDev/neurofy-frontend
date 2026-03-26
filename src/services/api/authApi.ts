import { apiClient } from "./client";
import type { SignupData, LoginData, AuthResponse, User } from "@/types/auth";

export const authApi = {
  signup: async (data: SignupData) => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      "/auth/signup",
      data
    );
    return response.data;
  },

  login: async (data: LoginData) => {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      "/auth/login",
      data
    );
    return response.data;
  },

  getCurrentUser: async (token: string) => {
    const response = await apiClient.get<{ success: boolean; data: User }>(
      "/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post<{ success: boolean; data: { accessToken: string } }>(
      "/auth/refresh",
      { refreshToken }
    );
    return response.data;
  },

  logout: async (token: string) => {
    const response = await apiClient.post<{ success: boolean }>(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response;
  },
};
