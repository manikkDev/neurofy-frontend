/**
 * Phase 6 – Notifications API (fixed: PUT→PATCH)
 */
import { apiClient } from "./client";
import type { Notification, ApiResponse } from "@/types";

const h = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const notificationsApi = {
  getNotifications: (token: string) =>
    apiClient.get<ApiResponse<Notification[]>>("/notifications", h(token)),

  getUnreadCount: (token: string) =>
    apiClient.get<ApiResponse<{ count: number }>>("/notifications/unread-count", h(token)),

  markAsRead: (id: string, token: string) =>
    apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`, {}, h(token)),

  markAllAsRead: (token: string) =>
    apiClient.patch<ApiResponse<{ message: string }>>("/notifications/mark-all-read", {}, h(token)),

  deleteNotification: (id: string, token: string) =>
    apiClient.delete<ApiResponse<{ message: string }>>(`/notifications/${id}`, h(token)),
};
