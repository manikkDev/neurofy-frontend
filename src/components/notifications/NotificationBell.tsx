/**
 * Phase 6 – NotificationBell (fixed & complete)
 *
 * - Polls every 30s for unread count
 * - Drop-down list with mark-as-read + delete
 * - Mark all as read button
 * - Unread count badge
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { notificationsApi } from "@/services/api/notificationsApi";
import { storage } from "@/lib/storage";
import type { Notification } from "@/types";

const TYPE_ICON: Record<string, string> = {
  alert: "🚨",
  appointment: "📅",
  report: "📄",
  note: "📝",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const token = storage.getToken();
      if (!token) return;
      const [nRes, cRes] = await Promise.all([
        notificationsApi.getNotifications(token),
        notificationsApi.getUnreadCount(token),
      ]);
      if (nRes.success) setNotifications(nRes.data ?? []);
      if (cRes.success) setUnreadCount(cRes.data?.count ?? 0);
    } catch {
      // silent — bell should never crash the app
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markRead = async (id: string) => {
    const token = storage.getToken();
    if (!token) return;
    await notificationsApi.markAsRead(id, token);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      await notificationsApi.markAllAsRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = storage.getToken();
    if (!token) return;
    await notificationsApi.deleteNotification(id, token);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-surface-overlay transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drop-down panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-raised border border-surface-border rounded-xl shadow-2xl z-50 flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border flex-shrink-0">
            <h3 className="text-sm font-semibold text-white">
              Notifications {unreadCount > 0 && <span className="text-red-400">({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`group px-4 py-3 border-b border-surface-border flex gap-3 cursor-pointer hover:bg-surface-overlay transition-colors ${
                    !n.isRead ? "bg-brand-500/5" : ""
                  }`}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] ?? "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-white leading-tight">{n.title}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                        <button
                          onClick={(e) => remove(n._id, e)}
                          className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
