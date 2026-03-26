/**
 * Phase 4 – Notes API (fixed)
 * Returns raw ApiResponse — no double-unwrap.
 */
import { apiClient } from "./client";
import type { DoctorNote, ApiResponse } from "@/types";

export const notesApi = {
  getNotes: (token: string, patientId?: string) => {
    const url = patientId ? `/notes?patientId=${patientId}` : "/notes";
    return apiClient.get<ApiResponse<DoctorNote[]>>(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getNoteById: (id: string, token: string) =>
    apiClient.get<ApiResponse<DoctorNote>>(`/notes/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createNote: (
    data: {
      patientId: string;
      doctorId: string;
      content: string;
      diagnosis?: string;
    },
    token: string
  ) =>
    apiClient.post<ApiResponse<DoctorNote>>("/notes", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
