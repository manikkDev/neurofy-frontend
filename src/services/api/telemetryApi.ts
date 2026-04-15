import { apiClient } from "./client";
import type { Telemetry, TremorEpisode, ApiResponse } from "@/types";

export const telemetryApi = {
  getTelemetryHistory: async (
    patientId: string,
    token: string,
    params?: {
      limit?: number;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `/telemetry/history/${patientId}${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await apiClient.get<ApiResponse<Telemetry[]>>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getEpisodes: async (
    patientId: string,
    token: string,
    params?: {
      limit?: number;
      severity?: string;
    }
  ) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.severity) queryParams.append("severity", params.severity);

    const url = `/telemetry/episodes/${patientId}${queryParams.toString() ? `?${queryParams}` : ""}`;
    const response = await apiClient.get<ApiResponse<TremorEpisode[]>>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  getLatestTelemetry: async (patientId: string, token: string) => {
    const response = await apiClient.get<ApiResponse<Telemetry>>(
      `/telemetry/latest/${patientId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  },
};
