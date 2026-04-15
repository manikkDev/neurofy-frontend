import { apiClient } from "./client";
import type { Device, ApiResponse } from "@/types";

export const deviceApi = {
  getDevices: async (token: string) => {
    const response = await apiClient.get<ApiResponse<Device[]>>("/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getDeviceById: async (deviceId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<Device>>(
      `/devices/${deviceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  registerDevice: async (
    data: {
      deviceId: string;
      label: string;
    },
    token: string
  ) => {
    const response = await apiClient.post<ApiResponse<Device>>(
      "/devices/register",
      data,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  pairDevice: async (deviceId: string, token: string) => {
    const response = await apiClient.post<ApiResponse<Device>>(
      "/devices/pair",
      { deviceId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },

  getDeviceStatus: async (deviceId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/devices/${deviceId}/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
