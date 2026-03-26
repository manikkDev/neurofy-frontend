/**
 * Phase 6 – Reports API (complete)
 */
import { apiClient } from "./client";
import type { Report, ApiResponse } from "@/types";

const h = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const reportsApi = {
  getReports: (token: string) =>
    apiClient.get<ApiResponse<Report[]>>("/reports", h(token)),

  getReportById: (id: string, token: string) =>
    apiClient.get<ApiResponse<Report>>(`/reports/${id}`, h(token)),

  /** Download triggers a real file fetch → blob → anchor click */
  downloadReport: async (id: string, token: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/reports/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Neurofy_Report_${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  updateStatus: (id: string, status: string, token: string) =>
    apiClient.patch<ApiResponse<Report>>(`/reports/${id}/status`, { status }, h(token)),
};
