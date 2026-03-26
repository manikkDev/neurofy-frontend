/**
 * Phase 5 – Doctor API client
 * All calls hit /api/doctors/* and require a doctor JWT.
 */
import { apiClient } from "./client";
import type { ApiResponse, DoctorNote, Report, Alert } from "@/types";

// ── Local types (doctor-only shapes) ────────────────────────────────

export interface DoctorDashboardData {
  totalPatients: number;
  activeAlerts: number;
  pendingAppointments: number;
  recentAlerts: Array<{
    _id: string;
    patientId: any;
    severity: string;
    triggeredAt: string;
    status: string;
    message?: string;
  }>;
  recentPatients: Array<{
    patientId: string;
    patientName: string;
    patientEmail: string;
    lastSeverity: string | null;
    lastActivity: string | null;
  }>;
}

export interface PatientListItem {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  lastSeverity: string | null;
  lastActivity: string | null;
  totalEpisodes: number;
  deviceStatus: string | null;
  devicePaired: boolean;
  lastSyncAt: string | null;
  activeAlerts: number;
}

export interface PatientDetailData {
  patient: { _id: string; name: string; email: string; createdAt: string; isActive: boolean };
  episodes: any[];
  stats: {
    totalEpisodes: number;
    severityBreakdown: { severe: number; moderate: number; mild: number };
    recentEpisodes: number;
    dailyCounts: Array<{ date: string; count: number }>;
  };
  notes: DoctorNote[];
  reports: Report[];
  device: {
    deviceId: string;
    label: string;
    status: string;
    pairingStatus: string;
    lastSyncAt?: string;
    batteryLevel?: number;
  } | null;
}

const h = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const doctorApi = {
  getDashboard: (token: string) =>
    apiClient.get<ApiResponse<DoctorDashboardData>>("/doctors/dashboard", h(token)),

  getPatients: (token: string, q?: string) =>
    apiClient.get<ApiResponse<PatientListItem[]>>(
      q ? `/doctors/patients?q=${encodeURIComponent(q)}` : "/doctors/patients",
      h(token)
    ),

  getPatientDetail: (patientId: string, token: string) =>
    apiClient.get<ApiResponse<PatientDetailData>>(`/doctors/patients/${patientId}/detail`, h(token)),

  createNote: (
    patientId: string,
    data: { content: string; diagnosis?: string; isPrivate?: boolean },
    token: string
  ) =>
    apiClient.post<ApiResponse<DoctorNote>>(`/doctors/patients/${patientId}/notes`, data, h(token)),

  getPatientNotes: (patientId: string, token: string) =>
    apiClient.get<ApiResponse<DoctorNote[]>>(`/doctors/patients/${patientId}/notes`, h(token)),

  createReport: (
    patientId: string,
    data: { title: string; summary: string; status?: string },
    token: string
  ) =>
    apiClient.post<ApiResponse<Report>>(`/doctors/patients/${patientId}/reports`, data, h(token)),

  getPatientReports: (patientId: string, token: string) =>
    apiClient.get<ApiResponse<Report[]>>(`/doctors/patients/${patientId}/reports`, h(token)),

  getSevereAlerts: (token: string) =>
    apiClient.get<ApiResponse<Alert[]>>("/doctors/alerts/severe", h(token)),

  acknowledgeAlert: (alertId: string, token: string) =>
    apiClient.patch<ApiResponse<Alert>>(`/doctors/alerts/${alertId}/acknowledge`, {}, h(token)),
};
