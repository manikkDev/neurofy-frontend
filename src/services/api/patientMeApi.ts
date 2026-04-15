/**
 * Phase 4 – Patient self-service API client
 *
 * All endpoints hit /api/patients/me/* which use JWT to identify the patient.
 * No patient ID needed in URLs.
 *
 * Returns the raw ApiResponse so callers can check .success and .data.
 */
import { apiClient } from "./client";
import type {
  ApiResponse,
  TremorEpisode,
  PatientStats,
  DoctorNote,
  Alert,
  PatientLiveDeviceState,
  DailySummary,
  WeeklySummary,
} from "@/types";

export interface DashboardSummary extends PatientStats {
  activeAlerts: number;
  lastEpisode: TremorEpisode | null;
  lastDetectedAt: string | null;
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
}

export const patientMeApi = {
  getDashboard: (token: string) =>
    apiClient.get<ApiResponse<DashboardSummary>>("/patients/me/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getHistory: (token: string, page = 1, limit = 20) =>
    apiClient.get<ApiResponse<TremorEpisode[]>>(
      `/patients/me/history?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  getStats: (token: string) =>
    apiClient.get<ApiResponse<PatientStats>>("/patients/me/stats", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getLive: (token: string) =>
    apiClient.get<ApiResponse<PatientLiveDeviceState>>("/patients/me/live", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDailySummary: (token: string) =>
    apiClient.get<ApiResponse<DailySummary>>("/patients/me/summary/daily", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getWeeklySummary: (token: string) =>
    apiClient.get<ApiResponse<WeeklySummary>>("/patients/me/summary/weekly", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getNotes: (token: string) =>
    apiClient.get<ApiResponse<DoctorNote[]>>("/patients/me/notes", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAlerts: (token: string) =>
    apiClient.get<ApiResponse<Alert[]>>("/patients/me/alerts", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  acknowledgeAlert: (alertId: string, token: string) =>
    apiClient.patch<ApiResponse<Alert>>(
      `/patients/me/alerts/${alertId}/acknowledge`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  getDoctors: (token: string) =>
    apiClient.get<ApiResponse<Doctor[]>>("/patients/me/doctors", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
