/**
 * Patients API — used by doctor pages to view patient data.
 * Fixed: no double-unwrap (returns raw ApiResponse).
 */
import { apiClient } from "./client";
import type { User, TremorEpisode, PatientStats, ApiResponse } from "@/types";

export const patientsApi = {
  getPatientsList: (token: string) =>
    apiClient.get<ApiResponse<User[]>>("/patients", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPatientDetails: (id: string, token: string) =>
    apiClient.get<ApiResponse<any>>(`/patients/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPatientHistory: (id: string, token: string) =>
    apiClient.get<ApiResponse<TremorEpisode[]>>(`/patients/${id}/history`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getPatientStats: (id: string, token: string) =>
    apiClient.get<ApiResponse<PatientStats>>(`/patients/${id}/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
