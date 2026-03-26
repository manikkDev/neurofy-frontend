/**
 * Phase 6 – Appointments API (fixed + extended)
 * Includes patient cancel + doctor accept/reject/reschedule
 */
import { apiClient } from "./client";
import type { Appointment, ApiResponse } from "@/types";

const h = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const appointmentsApi = {
  getAppointments: (token: string) =>
    apiClient.get<ApiResponse<Appointment[]>>("/appointments", h(token)),

  getAppointmentById: (id: string, token: string) =>
    apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`, h(token)),

  createAppointment: (
    data: { doctorId: string; scheduledAt: string; reason?: string },
    token: string
  ) => apiClient.post<ApiResponse<Appointment>>("/appointments", data, h(token)),

  cancelAppointment: (id: string, token: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, {}, h(token)),

  // Doctor actions
  acceptAppointment: (id: string, responseNote: string | undefined, token: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/accept`, { responseNote }, h(token)),

  rejectAppointment: (id: string, responseNote: string | undefined, token: string) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/reject`, { responseNote }, h(token)),

  rescheduleAppointment: (
    id: string,
    newDate: string,
    responseNote: string | undefined,
    token: string
  ) =>
    apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, { newDate, responseNote }, h(token)),

  getPendingForDoctor: (token: string) =>
    apiClient.get<ApiResponse<Appointment[]>>("/appointments/doctor/pending", h(token)),
};
