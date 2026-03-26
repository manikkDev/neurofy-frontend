/**
 * Phase 5 – Doctor Alerts Page (Complete)
 *
 * Shows all severe tremor alerts with:
 * - Active/acknowledged status
 * - Patient name + link to detail
 * - Timestamp and message
 * - Acknowledge button for active alerts
 * - Red-highlighted active alert cards
 */

import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui";
import { doctorApi } from "@/services/api/doctorApi";
import { storage } from "@/lib/storage";
import type { Alert } from "@/types";

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function DoctorAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.getSevereAlerts(token);
      if (res.success) setAlerts(res.data ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);

  const acknowledge = async (alertId: string) => {
    try {
      setAcknowledging(alertId);
      const token = storage.getToken();
      if (!token) return;
      const res = await doctorApi.acknowledgeAlert(alertId, token);
      if (res.success) {
        setAlerts((prev) =>
          prev.map((a) =>
            a._id === alertId ? { ...a, status: "acknowledged" } : a
          )
        );
      }
    } catch (err: any) {
      setError(err.message || "Failed to acknowledge alert");
    } finally {
      setAcknowledging(null);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const pastAlerts = alerts.filter((a) => a.status !== "active");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Severe Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Critical tremor events requiring clinical attention
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Active banner */}
      {activeAlerts.length > 0 && (
        <div className="p-4 bg-red-500/15 border border-red-500/40 rounded-xl flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
          <p className="text-sm font-semibold text-red-300">
            {activeAlerts.length} active severe alert{activeAlerts.length > 1 ? "s" : ""} — immediate attention required
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-gray-500">No severe alerts recorded</p>
            <p className="text-sm text-gray-600 mt-1">All patients are stable</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Active alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">
                Active ({activeAlerts.length})
              </h2>
              <div className="space-y-3">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert._id}
                    className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl flex items-start justify-between gap-4"
                  >
                    <div className="flex gap-3 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse flex-shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/doctor/patients/${(alert.patientId as any)?._id ?? alert.patientId}`}
                            className="text-sm font-semibold text-white hover:text-brand-300 transition-colors"
                          >
                            {(alert.patientId as any)?.name ?? "Unknown Patient"}
                          </Link>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40">
                            SEVERE
                          </span>
                        </div>
                        {alert.message && (
                          <p className="text-sm text-gray-300 mt-1">{alert.message}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1.5">
                          {new Date(alert.triggeredAt).toLocaleString()} · {timeAgo(String(alert.triggeredAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/doctor/patients/${(alert.patientId as any)?._id ?? alert.patientId}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-overlay border border-surface-border text-gray-300 hover:text-white transition-colors"
                      >
                        View Patient
                      </Link>
                      <button
                        onClick={() => acknowledge(alert._id)}
                        disabled={acknowledging === alert._id}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600/30 border border-red-500/40 text-red-300 hover:bg-red-600/50 transition-colors disabled:opacity-50"
                      >
                        {acknowledging === alert._id ? "…" : "Acknowledge"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past / acknowledged alerts */}
          {pastAlerts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Acknowledged / Resolved ({pastAlerts.length})
              </h2>
              <Card>
                <div className="divide-y divide-surface-border">
                  {pastAlerts.map((alert) => (
                    <div key={alert._id} className="py-3 px-1 flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0 mt-1.5" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to={`/doctor/patients/${(alert.patientId as any)?._id ?? alert.patientId}`}
                              className="text-sm text-gray-300 hover:text-brand-300 font-medium"
                            >
                              {(alert.patientId as any)?.name ?? "Unknown Patient"}
                            </Link>
                            <span className="px-1.5 py-0.5 rounded text-xs bg-gray-700 text-gray-400">
                              {alert.status}
                            </span>
                          </div>
                          {alert.message && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{alert.message}</p>
                          )}
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/doctor/patients/${(alert.patientId as any)?._id ?? alert.patientId}`}
                        className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
