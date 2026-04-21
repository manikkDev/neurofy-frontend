import { apiClient } from "./client";
import type { Device, ApiResponse } from "@/types";

export const deviceApi = {
  getDevices: async (token: string) => {
    const response = await apiClient.get<ApiResponse<Device[]>>("/devices", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  },

  getDeviceById: async (deviceId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<Device>>(
      `/devices/${deviceId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
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
    return response;
  },

  pairDevice: async (deviceId: string, token: string) => {
    const response = await apiClient.post<ApiResponse<Device>>(
      "/devices/pair",
      { deviceId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  },

  getDeviceStatus: async (deviceId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `/devices/${deviceId}/status`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  },

  updateTransportType: async (
    deviceId: string,
    transportType: "usb_serial" | "wifi",
    token: string
  ) => {
    const response = await apiClient.patch<ApiResponse<Device>>(
      `/devices/${deviceId}/transport`,
      { transportType },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  },

  getWiFiConfig: async (deviceId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<{
      deviceId: string;
      wifiToken: string;
      serverUrl: string;
    }>>(
      `/devices/${deviceId}/wifi-config`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  },

  regenerateWiFiToken: async (deviceId: string, token: string) => {
    const response = await apiClient.post<ApiResponse<{
      deviceId: string;
      wifiToken: string;
    }>>(
      `/devices/${deviceId}/regenerate-wifi-token`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response;
  },
};
